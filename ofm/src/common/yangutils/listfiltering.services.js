define(['common/yangutils/listfiltering.module'], function (listFiltering) {

    listFiltering.factory('nodeWrapperForFilter', function(constants, filterConstants) {
        nodeWrapperForFilter = {};

        nodeWrapperForFilter.init = function(node){

            node.childrenFilterConditions = function (children){
                var allowedNodeTypesForFilter = filterConstants.ALLOWED_NODE_TYPES_FOR_FILTER,
                    conditionTypes = function(item){
                        return allowedNodeTypesForFilter.some(function(elem){
                            return elem === item.type;
                    });},
                    conditionEmptyChildren = function(item){
                        return item.children.some(function(child){
                            return (child.type !== 'leaf-list' && child.type !== 'list');
                    });},
                    conditionChildDescription = function(item){
                        return !(item.children.every(function(childDes){
                            return childDes.type === 'description';
                    }));};

                return children.filter(function(item){
                    if(item.parent.type === 'leaf' || item.parent.parent.type === 'leaf'){
                        return true;
                    }else{
                        return conditionTypes(item) && conditionEmptyChildren(item) && conditionChildDescription(item);
                    }
                });
            };

            node.getChildrenForFilter = function () {
                return node.childrenFilterConditions(node.getChildren(null,null,constants.NODE_UI_DISPLAY,null));
            };

            node.deepCopyForFilter = function (additionalProperties) {

                var copy = node.getCleanCopy(),
                    self = this,
                    allowedLeafTypesForFilter = filterConstants.ALLOWED_LEAF_TYPES_FOR_FILTER,

                    addFilterProps = function(childrenArray){
                        if(childrenArray.type === 'leaf' && childrenArray.children && childrenArray.children.length){
                            if(childrenArray.children.some(function(item){
                                return item.type === 'type' && allowedLeafTypesForFilter.indexOf(item.label) !== -1;
                            })){
                                childrenArray['filterType'] = '=';
                            }
                            if(childrenArray.children.some(function(item){
                                return item.type === 'type' && item.label === 'bits';
                            })){
                                childrenArray['filterBitsValue'] = '';
                            }
                            if(childrenArray.children.some(function(item){
                                return item.type === 'type' && item.label === 'enumeration';
                            })){
                                childrenArray['filterSelectboxBitsValue'] = [];
                            }
                        }
                };

                additionalProperties = additionalProperties || ['pathString'];

                additionalProperties.forEach(function(prop) {
                    if (prop !== 'children' && self.hasOwnProperty(prop) && copy.hasOwnProperty(prop) === false) {
                        copy[prop] = self[prop];
                    }
                });

                this.childrenFilterConditions(this.children).forEach(function (child) {
                    var childCopy = null;
                    if(child.type === 'leaf'){
                        childCopy = child.deepCopy();
                    }else{
                        nodeWrapperForFilter.init(child);
                        childCopy = child.deepCopyForFilter();
                    }

                    childCopy.parent = copy;

                    addFilterProps(childCopy);

                    copy.children.push(childCopy);
                });

                addFilterProps(copy);

                return copy;
            };
        };

        nodeWrapperForFilter.wrapForFilter = function(node) {

            var comparePropToElemByName = function (propName, elemName) {
                    return (propName.indexOf(':') > -1 ? propName.split(':')[1] : propName) === elemName; //TODO also check by namespace - redundancy?
                },

                wrapperFilter = {

                    wrapFilter: function (node) {
                        if (this.hasOwnProperty(node.type)) {
                            this[node.type](node);
                        }
                    },

                    wrapAllFilter: function (node) {
                        var self = this;
                        self.wrapFilter(node);
                        node.children.forEach(function (child) {
                            self.wrapAllFilter(child);
                        });
                    },

                    leaf: function (node) {
                        var auxBuildRequest = node['buildRequest'],
                            auxFill = node['fill'],
                            auxClear = node['clear'],
                            fnToString = function (string) {
                                var valueStr = '';
                                try {
                                    valueStr = string.toString();
                                } catch (e) {
                                    console.warn('cannot convert value', node.value);
                                }
                                return valueStr;
                            };

                        node.expandedBits = false;

                        node.filterRangeFrom = '';
                        node.filterRangeTo = '';

                        node.buildRequest = function (builder, req) {
                            auxBuildRequest(builder, req);
                            var valueStr = '';
                            valueStr = fnToString(node.value);

                            filterTypeArray = {
                                                '=': function(element,filterValue,i){
                                                        return element ? element[i] === filterValue : false;
                                                    },
                                                '>': function(element,filterValue,i){
                                                        return element ? element[i] > filterValue : false;
                                                    },
                                                '>=': function(element,filterValue,i){
                                                        return element ? element[i] >= filterValue : false;
                                                    },
                                                '<': function(element,filterValue,i){
                                                        return element ? element[i] < filterValue : false;
                                                    },
                                                '<=': function(element,filterValue,i){
                                                        return element ? element[i] <= filterValue : false;
                                                    },
                                                'contains': function(element,filterValue,i){
                                                        return  element ? element[i] && element[i].indexOf(filterValue) > -1 : false;
                                                    },
                                                'regExp':  function(element,filterValue,i){
                                                        testRegExp = function (patternString, nodeValue) {
                                                            var pattern = new RegExp(patternString);
                                                            return pattern.test(nodeValue);
                                                        };
                                                    return  element ? testRegExp(filterValue,element[i]) : false;
                                                },
                                                'range': function(element,from,to,i){
                                                    if(from && to){
                                                        return element ? element[i] <= to && element[i] >= from : false;
                                                    }else if(from){
                                                        return element ? element[i] >= from : false;
                                                    }else{
                                                        return element ? element[i] <= to : false;
                                                    }
                                                }};

                            if (valueStr || (node.filterBitsValue && node.filterBitsValue !== '') || (node.filterSelectboxBitsValue && node.filterSelectboxBitsValue.length) || 
                                (node.filterRangeFrom && node.filterRangeFrom !==  '') || (node.filterRangeTo && node.filterRangeTo !==  '')){

                                reqFilter = {};

                                if(node.filterSelectboxBitsValue && node.filterSelectboxBitsValue.length){ 
                                    reqFilter.selectboxBitsValue = node.filterSelectboxBitsValue;
                                    reqFilter.getResult = function(element,filterValue,i){
                                        var selectSomeFun = function(filterSelectboxBitsValue,el){
                                            return filterSelectboxBitsValue.some(function(item,$index){
                                                return item === el;
                                            });
                                        };
                                        return element[i] && selectSomeFun(filterValue,element[i]);
                                    };
                                }else{
                                    if(node.filterBitsValue && node.filterBitsValue !== ''){
                                        reqFilter.bitsValue = node.filterBitsValue;
                                    }else{
                                        reqFilter.value = valueStr;
                                    }

                                    if(node.filterType){
                                        reqFilter.filterType = node.filterType;
                                    }else{
                                        reqFilter.filterType = '=';
                                    }

                                    if(node.filterRangeFrom){
                                        reqFilter.filterRangeFrom = node.filterRangeFrom;
                                    }


                                    if(node.filterRangeTo){
                                        reqFilter.filterRangeTo = node.filterRangeTo;
                                    }

                                    reqFilter.getFilterResult = filterTypeArray;
                                }

                                builder.insertPropertyToObj(req, node.label, reqFilter);

                                return true;
                            }
                            return false;
                        };

                        node.fill = function (name, data) {
                            if(data){
                                if(data.hasOwnProperty('value')){
                                    auxFill(name, data.value);
                                }
                                var match = '';

                                if(data.hasOwnProperty('filterType')){
                                    match = comparePropToElemByName(name, node.label);
                                    if(match){
                                        node.filterType = data.filterType;
                                    }
                                }
                                if(data.hasOwnProperty('bitsValue')){
                                    match = comparePropToElemByName(name, node.label);
                                    if(match){
                                        node.filterBitsValue = data.bitsValue;
                                    }
                                }
                                if(data.hasOwnProperty('selectboxBitsValue')){
                                    match = comparePropToElemByName(name, node.label);
                                    if(match){
                                        node.filterSelectboxBitsValue = data.selectboxBitsValue;
                                    }
                                }
                                if(data.hasOwnProperty('filterRangeFrom')){
                                    match = comparePropToElemByName(name, node.label);
                                    if(match){
                                        node.filterRangeFrom = data.filterRangeFrom;
                                    }
                                }
                                if(data.hasOwnProperty('filterRangeTo')){
                                    match = comparePropToElemByName(name, node.label);
                                    if(match){
                                        node.filterRangeTo = data.filterRangeTo;
                                    }
                                }
                            }else{
                                console.error('fill data are empty');
                            }
                        };

                        node.clear = function () {
                            auxClear();
                            node.value = '';

                            if(node.filterType){
                                node.filterType = '=';
                            }
                            if(node.filterBitsValue){
                                node.filterBitsValue = '';
                            }
                            if(node.filterSelectboxBitsValue){
                                node.filterSelectboxBitsValue = [];
                            }
                            if(node.filterRangeFrom){
                                node.filterRangeFrom = '';
                            }
                            if(node.filterRangeTo){
                                node.filterRangeTo = '';
                            }
                        };

                    },

                    type: function (node) {
                    },

                    length: function (node) {
                    },

                    range: function (node) {
                    },

                    pattern: function (node) {
                    },

                    container: function (node) {
                    },

                    rpc: function (node) {
                    },

                    input: function (node) {
                    },

                    output: function (node) {
                    },

                    case: function (node) {
                    },

                    choice: function (node) {
                    },

                    'leaf-list': function (node) {
                    },

                    key: function (node) {
                    },

                    list: function (node) {

                    },

                    _listElem: function (node) {
                    }
                };

            wrapperFilter.wrapAllFilter(node);
        };


        return nodeWrapperForFilter;
    });

    listFiltering.factory('listFiltering', function (nodeWrapperForFilter, reqBuilder) {

        var getNodePathInStructure = function (filterRootNode,node) {
                var iterator = -1,
                    findNodeInStructure = function (currentParentStructure){
                        if(currentParentStructure.children.length && currentParentStructure.type !== 'leaf'){  
                            if(!(currentParentStructure.children.some(function(element){ return element === node; }))){
                                currentParentStructure.children.forEach(function(child,index){
                                    checkHasSearchedNode(child,node);
                                });
                            }else{
                                wasFound = true;
                            }
                        }
                    },
                    checkHasSearchedNode = function (currentParent) {
                        if(currentParent === node){
                            wasFound = true;
                        }else{
                            if(currentParent.actElemStructure){
                                findNodeInStructure(currentParent.actElemStructure);
                            }else{
                                findNodeInStructure(currentParent);
                            }
                        }
                    },
                    getIndexOfSearchedNode = function (parentNodeStructure) {
                        parentNodeStructure.children.forEach(function(elem,index){
                                wasFound = false;
                                checkHasSearchedNode(elem,node);
                                if(wasFound){
                                    node.searchedPath.push(index);
                                }
                            });    
                        if(parentNodeStructure.children[node.searchedPath[iterator]] !== node){
                            getSearchedPath(parentNodeStructure.children[node.searchedPath[iterator]]);
                        }
                    },
                    getSearchedPath = function(parentNode){
                        iterator++;
                        if(parentNode.actElemStructure){
                            getIndexOfSearchedNode(parentNode.actElemStructure);
                        }else{
                            getIndexOfSearchedNode(parentNode);
                        }
                    };

            if(filterRootNode !== node){
                getSearchedPath(filterRootNode);
            }
        },

        clearFilterNodes = function(node) {
            node.referenceNode.filterNodes.forEach(function(filterNode){
                filterNode.clear();
            });
        },

        loadFilterNodes = function (node) {
            var fillFuc = function(fillNods, prop, filVal){
                fillNods.forEach(function(filterNode){
                    filterNode.fill(prop, filVal[prop]);
                });
            };

            if(node.referenceNode.filters[node.currentFilter].filteredValues){
                node.referenceNode.filters[node.currentFilter].filteredValues.forEach(function(item){
                    for (var prop in item) {
                        fillFuc(node.referenceNode.filterNodes, prop, item);
                    }
                });
            }
        },

        getFilterResult = function(element, filterValue, node){
            for (var i in filterValue){
                if(!filterValue[i].hasOwnProperty('value') && !filterValue[i].hasOwnProperty('selectboxBitsValue') && !filterValue[i].hasOwnProperty('bitsValue') &&
                !filterValue[i].hasOwnProperty('filterRangeFrom') && !filterValue[i].hasOwnProperty('filterRangeTo')){
                    getFilterResult(element[i],filterValue[i]);
                }else{
                     if(filterValue[i].selectboxBitsValue && filterValue[i].selectboxBitsValue.length){
                        filterResult = filterValue[i].getResult(element,filterValue[i].selectboxBitsValue,i);
                    }else{
                        if((filterValue[i].filterRangeFrom && filterValue[i].filterRangeFrom !== '') || (filterValue[i].filterRangeTo && filterValue[i].filterRangeTo !== '')){
                            filterResult = filterValue[i].getFilterResult[filterValue[i].filterType](element,filterValue[i].filterRangeFrom,filterValue[i].filterRangeTo,i);
                        }else if(filterValue[i].bitsValue && filterValue[i].bitsValue !== ''){
                            filterResult = filterValue[i].getFilterResult[filterValue[i].filterType](element,filterValue[i].bitsValue,i);
                        }else {
                            filterResult = filterValue[i].getFilterResult[filterValue[i].filterType](element,filterValue[i].value,i);
                        }
                    }
                }
            }
        },

        getActElementFilter = function (node) {
            var actData = [];

            node.actElemIndex = 0;
            if(node.filteredListData && node.filteredListData.length){
                actData = node.filteredListData[node.actElemIndex];
            }else{
                actData = node.listData[node.actElemIndex];
            }
            
            node.actElemStructure.clear();
            for (var prop in actData) {
                node.actElemStructure.fillListElement(prop, actData[prop]);
            }
        };

        listFiltering = {};

        listFiltering.removeEmptyFilters = function (node) {
            if(node.referenceNode && node.referenceNode.filters){
                var wasDeleted = false;
                node.referenceNode.filters = node.referenceNode.filters.filter(function(filter){
                    if(filter.filteredValues && filter.filteredValues.length){
                        return true;
                    }else{
                        wasDeleted = true;
                        return false;
                    }
                });

                if(wasDeleted){
                    listFiltering.switchFilter(node,0,true);
                }
            }
        };

        listFiltering.showListFilterWin = function (filterRootNode,node) {
            if(!node.searchedPath.length){
                getNodePathInStructure(filterRootNode,node);
            }

            if(!node.referenceNode){
                node.referenceNode = filterRootNode;
                node.searchedPath.forEach(function(elem){
                    node.referenceNode = node.referenceNode.children[elem];
                });
            }

            if(!node.referenceNode.filterNodes.length){
                nodeWrapperForFilter.init(node);
                node.referenceNode.filterNodes = node.getNewFilterElement();
            }

            if(!(node.referenceNode.filters && node.referenceNode.filters.length)){
                node.referenceNode.filters.push({name : 'Filter 1 name', active : 1});
            }else{
                listFiltering.getFilterData(node);
                listFiltering.removeEmptyFilters(node);
            }
            // console.info('showListFilterWin node',node,'node.referenceNode.filterNodes',node.referenceNode.filterNodes,'node.referenceNode.filters',node.referenceNode.filters);
        };

        listFiltering.createNewFilter = function (node) {
            node.referenceNode.filters.push({name : 'Filter ' + (node.referenceNode.filters.length+1) + ' name', active : 1});

            listFiltering.switchFilter(node,node.referenceNode.filters.length-1);
        };

        listFiltering.getFilterData = function (node) {
             node.referenceNode.filters[node.currentFilter].filteredValues = node.referenceNode.filterNodes.map(function(element){
                var requestData = {};
                element.buildRequest(reqBuilder, requestData);
                return requestData;
            }).filter(function(item){
                return $.isEmptyObject(item) === false;
            });
        };

        listFiltering.switchFilter = function (node,showedFilter,fromRemoveEmptyFilters) {
            if(node.referenceNode.filters.length){
                if(!fromRemoveEmptyFilters){
                    listFiltering.getFilterData(node);
                }
                clearFilterNodes(node);
                node.currentFilter = showedFilter;
                loadFilterNodes(node);
            }else{
                node.currentFilter = 0;
            }
        };

        listFiltering.applyFilter = function (node) {
            listFiltering.getFilterData(node);
            listFiltering.removeEmptyFilters(node);

            node.filteredListData = node.listData.slice().filter(function(element){
                return node.referenceNode.filters.filter(function(fil){
                        return fil.active === 1;
                    }).some(function(filter){
                        return filter.filteredValues.every(function(filterValue){
                            filterResult = null;
                            getFilterResult(element,filterValue,node);
                            return filterResult;
                        });
                    });
            });

            getActElementFilter(node);
            // console.info('applyFilter node',node,'node.referenceNode.filterNodes',node.referenceNode.filterNodes,'node.referenceNode.filters',node.referenceNode.filters);
        };

        listFiltering.clearFilterData = function (node, changeAct, filterForClear, removeFilters) {
            if(filterForClear){
                filterForClear--;
                if(node.referenceNode.filters.length === 1){
                    node.referenceNode.filters = [];
                    node.referenceNode.filters.push({name : 'Filter 1 name', active : 1});
                    clearFilterNodes(node);
                }else{
                    node.referenceNode.filters.splice(filterForClear,1);
                    node.currentFilter = 0;
                    clearFilterNodes(node);
                    loadFilterNodes(node);
                }
            }else{
                if(removeFilters){
                    node.referenceNode.filters = [];
                    clearFilterNodes(node);
                    node.currentFilter = 0;
                }else{
                    node.referenceNode.filters.forEach(function(filter){
                        filter.active = 2;
                    });
                    listFiltering.getFilterData(node);
                    listFiltering.removeEmptyFilters(node);
                }
                node.filteredListData = [];
            }

            if(changeAct){
                getActElementFilter(node);
            }

        };

        return listFiltering;
    });

    listFiltering.factory('filterConstants', function () {
        return  {
            ADVANCED_FILTERING_TYPES : {'number' : ['=','>','>=','<','<=','range'],'string' : ['=','contains','regExp']},
            ALLOWED_LEAF_TYPES_FOR_FILTER : ['string','uint32','uint8','decimal64','int16','int32','int64','int8','uint16','uint64','union','bits','leafref','identityref'],
            ALLOWED_NODE_TYPES_FOR_FILTER : ['case','choice','container','input','leaf','output','rpc']
        };
    });
});
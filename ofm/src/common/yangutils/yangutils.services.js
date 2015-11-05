define(['common/yangutils/yangutils.module'], function (yangUtils) {

    yangUtils.factory('nodeUtils',function () {
        var nu = {};

        nu.isRootNode = function(type) {
            return type === 'container' || type === 'list' || type === 'rpc';
        };

        nu.isOnlyOperationalNode = function(node) {
            return node.hasOwnProperty('isConfigStm') ? node.isConfigStm !== false : true;
        };

        return nu;
    });

    yangUtils.factory('YangUtilsRestangular', ['Restangular', 'ENV', 'constants', function (Restangular, ENV, constants) {
        var isEmptyElement = function(element) {
            return element.hasOwnProperty('id') && element.id === undefined;
        };

        var r = Restangular.withConfig(function(RestangularConfig) {
//            RestangularConfig.setBaseUrl(ENV.getBaseURL("CONTROLLER"));
            RestangularConfig.setBaseUrl(ENV.getBaseURL("MD_SAL"));
            RestangularConfig.setRequestInterceptor(function(elem, operation) {
                if (operation === 'post' && isEmptyElement(elem)) {
                    return null;
                } else {
                    return elem;
                }
            });
        });

        return r;
    }]);

    yangUtils.factory('parsingJson', function () {
        var pj = {};

        pj.parseJson = function(data, parsingErrorClbk){

            var result = null;

            try{
                result = JSON.parse(data);
            }catch(e){
                if(angular.isFunction(parsingErrorClbk)){
                    parsingErrorClbk(e);
                }
            }

            finally {
                return result;
            }

        };

        return pj;
    });

    yangUtils.factory('eventDispatcher', function () {

        var eD = {};

        var convertArgsToList = function(arg) {
            var argList = [],
                l = arg.length,
                i = 0;

            for(i = 0; i < l; i++) {
                argList.push(arg[i]);
            }

            return argList;
        };

        eD.broadcastHandler = {};

        eD.registerHandler = function(source, bcCallback) {
            eD.broadcastHandler[source] = bcCallback;
        };

        eD.dispatch = function() {
            var args = convertArgsToList(arguments),
                argumentList = args.slice(1),
                handler = eD.broadcastHandler[arguments[0]];

            if(handler) {
                handler(argumentList);
            }
        };

        return eD;
    });

    yangUtils.factory('arrayUtils', function () {

        var arrayUtils = {};

        arrayUtils.getFirstElementByCondition = function(list, condition) {
            var selItems = list && condition ? list.filter(function(item) {
                return condition(item);
            }) : [];
            return (selItems.length ? selItems[0] : null);
        };

        arrayUtils.pushElementsToList = function(list, listToAdd) {
            listToAdd.forEach(function(e) {
                list.push(e);
            });
        };

        return arrayUtils;
    });

    yangUtils.factory('YangUIApis', function (YangUtilsRestangular) {
        var apis = {};

        apis.getAllModules = function() {
            return YangUtilsRestangular.one('restconf').one('modules');
        };

        apis.getModuleSchema = function(name, rev) {
            return YangUtilsRestangular.one('restconf').one('modules').one('module').one(name).one(rev).one('schema');
        };

        apis.getSingleModuleInfo = function(modulePath) {
            return YangUtilsRestangular.one('restconf').one('modules').one('module').customGET(modulePath);
        };

        apis.getAllApis = function() {
            return YangUtilsRestangular.one('apidoc').one('apis');
        };

        apis.getSingleApiInfo = function(apiPath) {
            return YangUtilsRestangular.one('apidoc').one('apis').customGET(apiPath);
        };

        apis.getCustomModules = function(baseApiPath) {
            return YangUtilsRestangular.one('restconf').one('modules').customGET(baseApiPath);
        };

        apis.getCustomModules = function(baseApiPath) {
            return YangUtilsRestangular.one('restconf').one('modules').customGET(baseApiPath);
        };

        return apis;
    });

    yangUtils.factory('pathUtils', function (arrayUtils, syncFact) {

        var pathUtils = {},
            parentPath = '..';

        var Idenfitier = function(label, value) {
            this.label = label;
            this.value = value || '';
        };

        var PathElem = function (name, module, identifierNames, moduleChanged, revision) {
            this.name = name;
            this.module = module;
            this.identifiers = identifierNames ? identifierNames.map(function(name) {
                return new Idenfitier(name);
            }) : [];
            this.moduleChanged = moduleChanged || false;
            this.revision = revision;

            this.equals = function(comparedElem, compareIdentifierValues) {
                var result = this.name === comparedElem.name && this.module === comparedElem.module && this.identifiers.length === comparedElem.identifiers.length;

                if(result) {
                    var identifiersCnt = this.identifiers.length,
                        i;

                    for(i = 0; i < identifiersCnt && result; i++) {
                        result = this.identifiers[i].label === comparedElem.identifiers[i].label;
                        if(compareIdentifierValues) {
                            result = this.identifiers[i].value === comparedElem.identifiers[i].value;
                        }
                    }
                }

                return result;
            };

            this.hasIdentifier = function () {
                return this.identifiers.length > 0;
            };

            this.addIdentifier = function(name) {
                this.identifiers.push(new Idenfitier(name));
            };

            this.getIdentifierValues = function() {
                return this.identifiers.map(function(i) {
                    return i.value;
                });
            };

            this.toString = function () {
                return (this.module ? this.module + ':' : '') + this.name + '/' + (this.hasIdentifier() ? this.getIdentifierValues().join('/') + '/' : '');
            };

            this.checkNode = function (node) {
                return (this.module ? this.module === node.module : true) && (this.name ? this.name === node.label : true) && (this.revision ? this.revision === node.moduleRevision : true);
            };

            this.clone = function() {
                var copy = new PathElem(this.name, this.module, null, this.moduleChanged, this.revision);

                copy.identifiers = this.identifiers.map(function(i) {
                    return new Idenfitier(i.label, i.value);
                });

                return copy;
            };
        };

        var getModuleNodePair = function (pathString, defaultModule) {
            return pathString.indexOf(':') > -1 ? pathString.split(':') : [defaultModule, pathString];
        };

        var isIdentifier = function (item) {
            return (item.indexOf('{') === item.indexOf('}')) === false;
        };

        var searchForRevisionInImportNodes = function(module, importNodes) {
            var revision = null,
                node = importNodes.filter(function(i) {
                    return i.label === module;
                })[0];

            if(node) {
                revision = node._revisionDate;
            }

            return revision;
        };

        pathUtils.createPathElement = function (name, module, identifierStrings, moduleChanged, revision) {
            return new PathElem(name, module, identifierStrings, moduleChanged, revision);
        };

        pathUtils.search = function (node, path) {
            var pathElem = path.shift(),
                selNode = pathElem.name === parentPath ?
                node.parent :
                arrayUtils.getFirstElementByCondition(node.children, function (child) {
                    return pathElem.checkNode(child);
                });

            if (selNode !== null) {
                if (path.length) {
                    return pathUtils.search(selNode, path);
                } else {
                    return selNode;
                }
            } else {
                console.warn('pathUtils.search: cannot find element ',pathElem.name);
                return null;
            }
        };

        pathUtils.translate = function(path, prefixConverter, importNodes, getDefaultModuleCallback) {
            var pathStrElements = path.split('/').filter(function(e) {
                    return e !== '';
                }),
                pathArrayElements = [],
                index,
                maxIndex = pathStrElements.length,
                getLastElement = function(a) {
                    return pathArrayElements.length > 0 ? pathArrayElements[pathArrayElements.length - 1] : null;
                },
                getElementModule = function(e) {
                    return e ? e.module : '';
                },
                getModuleChange = function(actModule, lastElemModule) {
                    return (lastElemModule !== null) ? actModule !== lastElemModule : false;
                };

            for(index = 0; index < maxIndex; index += 1) {
                var actElem = pathStrElements[index],
                    lastElem = getLastElement(pathArrayElements);

                if(isIdentifier(actElem) && lastElem) {
                    lastElem.addIdentifier(actElem.slice(1, -1));
                } else {
                
                    var lastElemModule = getElementModule(lastElem),
                        defaultModule = getDefaultModuleCallback ? getDefaultModuleCallback() : lastElemModule,
                        pair = getModuleNodePair(actElem, defaultModule),
                        processedModule = (prefixConverter && pair[0] !== lastElemModule) ? prefixConverter(pair[0]) : pair[0],
                        revision = importNodes ? searchForRevisionInImportNodes(processedModule, importNodes) : null,
                        pathElem = pathUtils.createPathElement(pair[1], processedModule, null, getModuleChange(processedModule, lastElemModule), revision);

                    pathArrayElements.push(pathElem);
                }
            }

            return pathArrayElements;
        };

        pathUtils.translatePathArray = function(pathArray) {
            var getIdentifiersValues = function(identifiers) {
                    return identifiers.map(function(i) {
                        return i.value;
                    }).join('/');
                },
                getLastElem = function(i) {
                    var result = null;
                    if((i - 1) >= 0) {
                        result = pathArray[i - 1];
                    }
                    return result;
                },
                getModuleStr = function(actElem, lastElem) {
                    return ((lastElem && actElem.module && lastElem.module !== actElem.module) ? (actElem.module + ':') : '');
                },
                getIdentifiersStr = function(actElem) {
                    return (actElem.hasIdentifier() ? '/' + getIdentifiersValues(actElem.identifiers) : '');
                },
                getElemStr = function(actElem, lastElem) {
                    return getModuleStr(actElem, lastElem) + actElem.name + getIdentifiersStr(actElem);
                };

            return pathArray.map(function(pe, i) {
                return getElemStr(pe, getLastElem(i));
            });
        };

        var trimPath = function(pathString) {
            var searchStr = 'restconf',
                output = pathString;

            if(pathString.indexOf(searchStr) > -1) {
                output = pathString.slice(pathString.indexOf(searchStr)+searchStr.length+1);
            }

            return output;
        };

        var changeTreeDataNode = function(treeApiNode, treeData, prop, val) {
            var sel = treeApiNode ? treeData.filter(function(d) {
                            return d.branch.uid === treeApiNode.uid;
                        }) : [];

            if(sel.length === 1) {
                sel[0].branch[prop] = val;
            }
        };

        var changeTreeDataByProp = function(treeData, props, vals) {
            treeData.forEach(function(d, index) {
                props.forEach(function(v, i){
                    d.branch[v] = vals[i];
                });
            });
        };

        pathUtils.fillPath = function(pathArrayIn, pathString) {
            var pathArray = trimPath(pathString).split('/'),
                pathPosition = 0;

            pathArrayIn.forEach(function(pathItem, index){
                if ( pathItem.hasIdentifier() ){
                    pathItem.identifiers.forEach(function(identifier){
                        pathPosition++;
                        identifier.value = pathArray[pathPosition];
                    });
                }
                pathPosition++;
            });

        };

        var getActElementChild = function(actElem, childLabel) {
            var sel = actElem.children.filter(function(child) {
                    return child.label === childLabel;
                }),
                ret = sel.length === 1 ? sel[0] : null;

            return ret;
        };

        pathUtils.getModuleNameFromPath = function(path){
            var pathArray = pathUtils.translate(trimPath(path));

            return pathArray.length > 1 ? pathArray[1].module : null;
        };

        pathUtils.searchNodeByPath = function(pathString, treeApis, treeData, disabledExpand) {
            var pathArray = pathUtils.translate(trimPath(pathString)),
                module = pathArray.length > 1 ? pathArray[1].module : null,
                selectedTreeApi = module ? treeApis.filter(function(treeApi) {
                    return treeApi.module === module;
                })[0] : null,
                retObj = null;

            if(selectedTreeApi && pathArray.length) {
                var actElem = selectedTreeApi,
                    continueCondition = true;

                if ( !disabledExpand ) {
                    changeTreeDataByProp(treeData, ['expanded','selected'], [false, false]);
                }

                for(i = 0; i < pathArray.length && continueCondition; ) {
                    if ( !disabledExpand ) {
                        changeTreeDataNode(actElem, treeData, 'expanded', true);
                    }

                    var nextElem = getActElementChild(actElem, pathArray[i].name);
                    if(nextElem !== null) {
                        actElem = nextElem;
                        i = i + ( actElem && actElem.identifiersLength > 0 ? actElem.identifiersLength + 1 : 1);
                    } else {
                        continueCondition = false;
                    }
                }

                if ( !disabledExpand ) {
                    changeTreeDataNode(actElem, treeData, 'selected', true);
                }

                if(actElem) {
                    retObj = { indexApi: actElem.indexApi, indexSubApi: actElem.indexSubApi };
                }
            }
            return retObj;
        };

        pathUtils.fillIdentifiers = function(identifiers, label, value) {
          identifiers.some(function(i) {
                var identifierMatch = i.label === label;
                if(identifierMatch) {
                    i.value = value || '';
                }

                return identifierMatch;
            });
        };

        pathUtils.fillListNode = function(node, label, value) {
            if(node.type === 'list' && node.actElemStructure !== null) {
                var nodeToFill = node.actElemStructure.getChildren('leaf', label)[0];

                if(nodeToFill) {
                  nodeToFill.fill(nodeToFill.label, value);
                }
            }
        };

        pathUtils.fillListRequestData = function(data, listLabel, label, value){
            if ( data.hasOwnProperty(listLabel) && data[listLabel].length ) {
                data[listLabel][0][label] = value;
            }
        };

        pathUtils.findIndexOfStrInPathStr = function(pathParts, targetStr) { //pathParts is path string split by '/'
            var targetIndex = -1;

            pathParts.some(function(p, i) {
                var condition = p === targetStr;
                if(condition) {
                    targetIndex = i;
                }
                return condition;
            });

            return targetIndex;
        };

        pathUtils.getStorageAndNormalizedPath = function(pathStr) {
            var pathParts = pathStr.split('/'),
                restconfIndex = pathUtils.findIndexOfStrInPathStr(pathParts, 'restconf'),
                storage = pathParts[restconfIndex + 1],
                normalizedPath = pathParts.slice(restconfIndex + 1).join('/');

            return { storage: storage, normalizedPath: normalizedPath };
        };

        pathUtils.__test = {
            PathElem: PathElem,
            getModuleNodePair: getModuleNodePair,
            isIdentifier: isIdentifier
        };

        return pathUtils;
    });

    yangUtils.factory('syncFact', function ($timeout) {
        var timeout = 180000;

        var SyncObject = function () {
            this.runningRequests = [];
            this.reqId = 0;
            this.timeElapsed = 0;

            this.spawnRequest = function (digest) {
                var id = digest + (this.reqId++).toString();
                this.runningRequests.push(id);
                //console.debug('adding request ',id,' total running requests  = ',this.runningRequests);
                return id;
            };

            this.removeRequest = function (id) {
                var index = this.runningRequests.indexOf(id);

                if (index > -1) {
                    this.runningRequests.splice(index, 1);
                    //console.debug('removing request ',id,' remaining requests = ',this.runningRequests);
                } else {
                    console.warn('cannot remove request', id, 'from', this.runningRequests, 'index is', index);
                }
            };

            this.waitFor = function (callback) {
                var t = 1000,
                        processes = this.runningRequests.length,
                        self = this;

                if (processes > 0 && self.timeElapsed < timeout) {
                    // console.debug('waitin on',processes,'processes',this.runningRequests);
                    $timeout(function () {
                        self.timeElapsed = self.timeElapsed + t;
                        self.waitFor(callback);
                    }, t);
                } else {
                    callback();
                }
            };
        };

        return {
            generateObj: function () {
                return new SyncObject();
            }
        };
    });


    yangUtils.factory('custFunct', function (reqBuilder) {
        var CustFunctionality = function (label, node, callback, viewStr, hideButtonOnSelect) {
            this.label = label;
            this.callback = callback;
            this.viewStr = viewStr;
            this.hideButtonOnSelect = hideButtonOnSelect;

            this.setCallback = function (callback) {
                this.callback = callback;
            };

            this.runCallback = function (args) {
                if (this.callback) {
                    this.callback(args);
                } else {
                    console.warn('no callback set for custom functionality', this.label);
                }
            };
        };

        var cmpApiToTemplatePath = function(subApi, templateStr) {
            var subApiStr = subApi.storage + '/' + subApi.pathTemplateString;
            return subApiStr === templateStr;
        };

        custFunct = {};

        custFunct.createNewFunctionality = function (label, node, callback, viewStr, hideButtonOnSelect) {
            if (node && callback) {
                return new CustFunctionality(label, node, callback, viewStr, hideButtonOnSelect);
            } else {
                console.error('no node or callback is set for custom functionality');
            }
        };

        custFunct.getMPCustFunctionality = function(funcList) {
            var mpCF = funcList.filter(function(cf) {
                return cf.label === 'YANGUI_CUST_MOUNT_POINTS';
            });

            return mpCF[0];
        };

        custFunct.createCustomFunctionalityApis = function (apis, module, revision, pathString, label, callback, viewStr, hideButtonOnSelect) {
            apis = apis.map(function (item) {
                if ((module ? item.module === module : true) && (revision ? item.revision === revision : true)) {

                    item.subApis = item.subApis.map(function (subApi) {
                        
                        if (cmpApiToTemplatePath(subApi, pathString)) {
                            subApi.addCustomFunctionality(label, callback, viewStr, hideButtonOnSelect);
                        }

                        return subApi;
                    });
                }

                return item;
            });
        };

        return custFunct;
    });


    yangUtils.factory('reqBuilder', function () {

        var transformPropData = function(data) {
            // return data || {};
            return data;
        };

        var builder = {
            createObj: function () {
                return {};
            },
            createList: function () {
                return [];
            },
            insertObjToList: function (list, obj) {
                list.push(obj);
            },
            insertPropertyToObj: function (obj, propName, propData) {
                var data = transformPropData(propData),
                    name = propName;

                obj[name] = data;
            },
            resultToString: function (obj) {
                return JSON.stringify(obj, null, 4);
            }
        };

        return builder;

    });


    yangUtils.factory('typeWrapper', function (restrictionsFact) {
        var findLeafParent = function (node) {
            if (node.type === 'leaf') {
                return node;
            } else {
                if (node.parent) {
                    return findLeafParent(node.parent);
                } else {
                    return null;
                }
            }
        };

        var wrapper = {
            wrapAll: function (node) {
                if (node.type === 'type') {
                    this._setDefaultProperties(node);
                }

                if(this.hasOwnProperty(node.label)) {
                    this[node.label](node);
                }
            },
            _setDefaultProperties: function (node) {
                var fnToString = function (string) {
                    var valueStr = '';

                    if(string !== null) {
                        try {
                            valueStr = string.toString();
                        } catch (e) {
                            console.warn('cannot convert value', node.value);
                        }
                    }

                    return valueStr;
                };

                node.leafParent = findLeafParent(node);
                node.builtInChecks = [];
                node.errors = [];
                node.clear = function () {
                };
                node.fill = function () {
                };
                node.performRestrictionsCheck = function (value) {
                    var patternRestrictions = node.getChildren('pattern'),
                        patternCheck = function(value) {
                            return patternRestrictions.map(function(patternNode) {
                                return patternNode.restrictions[0];
                            }).some(function(patternRestriction) {
                                var condition = patternRestriction.check(value);
                                if(condition === false) {
                                    node.errors.push(patternRestriction.info);
                                }
                                return condition;
                            });
                        },
                        lengthRestrictions = node.getChildren('length'),
                        rangeRestrictions = node.getChildren('range'),
                        lengthRangeCheck = function(restrictionsContainers, value) {
                            return restrictionsContainers[0].restrictions.some(function(restriction) {
                                var condition = restriction.check(value);
                                if(condition === false) {
                                    node.errors.push(restriction.info);
                                }
                                return condition;
                            });
                        };
                    
                    var patternCondition = patternRestrictions.length ? patternCheck(value) : true,
                        lengthCondition = lengthRestrictions.length && value.length? lengthRangeCheck(lengthRestrictions, value.length) : true,
                        rangeCondition = rangeRestrictions.length ? lengthRangeCheck(rangeRestrictions, value) : true;

                    return patternCondition && lengthCondition && rangeCondition;
                };
                node.performBuildInChecks = function (value) {
                    return node.builtInChecks.length ? node.builtInChecks.every(function (restriction) {
                        var condition = restriction.check(value);
                        if(condition === false) {
                            node.errors.push(restriction.info);
                        }
                        return condition;
                    }) : true;
                };
                node.check = function (value) {
                    node.errors = [];
                    var condition = value !== '' ? node.performBuildInChecks(value) && node.performRestrictionsCheck(value) : true;
                    if(condition) {
                        node.errors = [];
                    }
                    return condition;
                };
                node.getValue = function(){
                    return fnToString(node.leafParent.value);
                };
            },
            // string: function (node) {
            // },
            // boolean: function (node) {
            // },
            empty: function (node) {
                node.setLeafValue = function (value) {
                    node.leafParent.value = value === 1 ? {} : '';
                };
                
                node.clear = function () {
                    node.value = null;
                };

                node.fill = function (value) {
                    node.emptyValue = value === '' ? 1 : ($.isEmptyObject(value) ? 1 : 0);
                    node.leafParent.value = parseInt(node.emptyValue, 10) === 1 ? {} : '';
                };

                node.getValue = function(){
                    return parseInt(node.emptyValue, 10) === 1 ? {} : '';
                };
            },
            enumeration: function (node) {
                node.selEnum = null;
                
                var childNames = [];
                node.getChildren('enum').forEach(function(child) {
                    childNames.push(child.label);
                });
                node.builtInChecks.push(restrictionsFact.isInArray(childNames));

                node.setLeafValue = function (value) {
                    if(value !== null) {
                        node.leafParent.value = value;
                    }
                };
                
                node.clear = function () {
                    node.selEnum = null;
                };

                node.fill = function (value) {
                    var selChild = node.getChildren('enum', value)[0];
                    node.selEnum = selChild ? selChild : null;
                };
            },
            bits: function (node) {
                var actBitsLen = 0,
                    i;

                node.maxBitsLen = node.getChildren('bit').length;
                node.bitsValues = [];

                for (i = 0; i < node.maxBitsLen; i++) {
                    node.bitsValues[i] = 0;
                }

                node.clear = function () {
                    for (i = 0; i < node.bitsValues.length; i++) {
                        node.bitsValues[i] = 0;
                    }
                };

                node.fill = function (value) {
                    var bitLabels = node.getChildren('bit').map(function(bit) {
                            return bit.label;
                        });
                    
                    node.leafParent.value.split(' ').forEach(function(val) {
                        var valIndex = bitLabels.indexOf(val);
                        if(valIndex !== -1) {
                            node.bitsValues[valIndex] = 1;
                        }
                    });
                };

                node.setLeafValue = function (values, fromFilter) {
                    var bitLabels = node.getChildren('bit').map(function(bit) {
                            return bit.label;
                        }),
                        nodeValue = null;

                    nodeValue = node.bitsValues.map(function(val, index) {
                        if(parseInt(val, 10) === 1) {
                            return bitLabels[index];
                        } else {
                            return null;
                        }
                    }).filter(function(val) {
                        return val !== null;
                    }).join(" ");

                    node.leafParent.value = nodeValue;
                    if(fromFilter){
                        node.leafParent.filterBitsValue = nodeValue;
                    }
                };
            },
            // binary: function (node) {
            // },
            // leafref: function (node) {
            // },
            // identityref: function (node) {
            // },
            union: function (node) {
                node.clear = function () {
                    node.getChildren('type').forEach(function(child) {
                        child.clear();
                    });
                };
                node.fill = function (value) {
                    node.getChildren('type').forEach(function(child) {
                        child.fill(value);
                    });
                };

                node.check = function (value) {
                    var condition = false;
                    node.getChildren('type').forEach(function (childType) {
                        var childCondition = childType.check(value);
                        condition = condition || childCondition;
                    });
                    return condition;
                };

                node.getChildren('type').forEach(function (childType) {
                    wrapper.wrapAll(childType);
                });
            },
            // 'instance-identifier': function (node) {
            // },
            decimal64: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsDecimalFnc());
            },
            int8: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(-128, 127));
            },
            int16: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(-32768, 32767));
            },
            int32: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(-2147483648, 2147483647));
            },
            int64: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(-9223372036854775808, 9223372036854775807));
            },
            uint8: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsUNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(0, 255));
            },
            uint16: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsUNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(0, 65535));
            },
            uint32: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsUNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(0, 4294967295));
            },
            uint64: function (node) {
                node.builtInChecks.push(restrictionsFact.getIsUNumberFnc());
                node.builtInChecks.push(restrictionsFact.getMinMaxFnc(0, 18446744073709551615));
            }
        };

        wrapper.__test = {
            findLeafParent: findLeafParent
        };

        return wrapper;

    });

    yangUtils.factory('nodeWrapper', function (constants, $timeout, reqBuilder, restrictionsFact, typeWrapper, listFiltering, eventDispatcher) {

        var comparePropToElemByName = function comparePropToElemByName(propName, elemName) {
            // AUGMENT FIX
            // return propName === elemName; //TODO also check by namespace - redundancy?
            
            return (propName.indexOf(':') > -1 ? propName.split(':')[1] : propName) === elemName; //TODO also check by namespace - redundancy?
        };

        var equalArrays = function (arrA, arrB) {
            var match = (arrA.length === arrB.length) && arrA.length > 0;

            if (match) {
                var i = 0;
                while (i < arrA.length && match) {
                    var valMatch = arrA[i] === arrB[i];
                    match = match && valMatch;
                    i++;
                }
            }
            return match;
        };

        var equalListElems = function (listElemA, listElemB, refKey) {
            var getKeyValue = function (data, label, module) {
                    if (data && data.hasOwnProperty(label)) {
                        return data[label];
                    } else if (data && data.hasOwnProperty(module + ':' + label)) {
                        return data[module + ':' + label];
                    } else {
                        return null;
                    }
                },
                getKeyArrayValues = function (data, refKey) {
                    return refKey.map(function (key) {
                        return getKeyValue(data, key.label, key.module);
                    }).filter(function (item) {
                        return item !== null;
                    });
                },
                keyValuesA = getKeyArrayValues(listElemA, refKey);
                keyValuesB = getKeyArrayValues(listElemB, refKey);

            return equalArrays(keyValuesA, keyValuesB);
        };

        var checkListElemKeys = function (listData, refKey) {
            var doubleKeyIndexes = [],
                checkedElems = [];

            listData.forEach(function (item, index) {
                var duplitactes = checkedElems.filter(function (checked) {
                    var isDuplicate = equalListElems(item, checked.item, refKey);
                    if (isDuplicate && doubleKeyIndexes.indexOf(checked.index) === -1) {
                        doubleKeyIndexes.push(checked.index);
                    }
                    return isDuplicate;
                });

                if (duplitactes.length) {
                    //item is already in checkedElems so we don't need to push it again
                    doubleKeyIndexes.push(index);
                } else {
                    checkedElems.push({index: index, item: item});
                }
            });

            return doubleKeyIndexes;
        };

        var parseRestrictText = function (text) {
            return text.split('|').map(function (elem) {
                var subElems = elem.split('..');
                return subElems.length === 1 ? restrictionsFact.getEqualsFnc(subElems[0]) :
                                               restrictionsFact.getMinMaxFnc(subElems[0], subElems[1]);
            });
        };


        var getTypes = function (node) {
            var types = [];

            var getTypesRecursive = function (node, types) {
                types.push(node);

                node.getChildren('type').forEach(function (child) {
                    getTypesRecursive(child, types);
                });
            };

            node.getChildren('type').forEach(function (child) {
                //console.info('child', child);
                getTypesRecursive(child, types);
            });

            return types;
        };

        var wrapper = {
            wrap: function (node) {
                if (this.hasOwnProperty(node.type)) {
                    this[node.type](node);
                }
            },
            wrapAll: function (node) {
                var self = this;
                self.wrap(node);
                node.children.forEach(function (child) {
                    self.wrapAll(child);
                });
            },
            checkKeyDuplicity: function (listData, refKey) {
                return checkListElemKeys(listData, refKey);
            },
            leaf: function (node) {
                node.value = '';
                node.valueIsValid = true;
                node.typeChild = node.getChildren('type')[0];

                node.buildRequest = function (builder, req, module) {
                    var value = node.typeChild.getValue(),
                        labelWithModule = (module !== node.module ? node.module + ':' : '') + node.label;

                    if(node.isKey()) {
                        eventDispatcher.dispatch(constants.EV_FILL_PATH, node, value);
                    }

                    if (value) {
                        builder.insertPropertyToObj(req, labelWithModule, value);
                        return true;
                    }

                    return false;
                };

                node.fill = function (name, data) {
                    var match = '';

                    match = comparePropToElemByName(name, node.label);
                    if (match) {
                        node.value = data.toString();
                        if (node.typeChild) {
                            node.typeChild.fill(node.value);
                        }
                    }
                    return match;
                };

                node.clear = function () {
                    node.value = '';

                    if (node.typeChild) {
                        node.typeChild.clear();
                    }
                };

                node.isFilled = function () {
                    var filled = node.typeChild.getValue() ? true : false;
                    return filled;
                };

                node.checkValueType = function () {
                    node.valueIsValid = node.typeChild ? node.typeChild.check(node.value) : true;
                };

                node.isKey = function() {
                    return node.parent && node.parent.type === 'list' && node.parent.refKey && node.parent.refKey.indexOf(node) !== -1;
                };
            },
            type: function (node) {
                typeWrapper.wrapAll(node);
            },
            length: function (node) {
                node.restrictions = parseRestrictText(node.label);
            },
            range: function (node) {
                node.restrictions = parseRestrictText(node.label);
            },
            pattern: function (node) {
                node.restrictions = [restrictionsFact.getReqexpValidationFnc(node.label)];
            },
            // enum: function (node) {
            // },
            // bit: function (node) {
            // },
            // position: function (node) {
            // },
            container: function (node) {
                node.expanded = false;

                node.toggleExpand = function () {
                    node.expanded = !node.expanded;
                };

                node.buildRequest = function (builder, req, module) {
                    var added = false,
                        name = node.label,
                        objToAdd = builder.createObj(),
                        builderNodes = node.getChildren(null, null, constants.NODE_UI_DISPLAY),
                        checkEmptyContainer = function(type, obj) { //TODO: absolete after when statement is implemented
                            return !!(type === 'case' || !$.isEmptyObject(objToAdd));
                        },
                        checkPresence = function(containerNode) {
                            return containerNode.children.some(function(ch) {
                                return ch.type === 'presence';
                            });
                        },
                        labelWithModule = (module !== node.module ? node.module + ':' : '') + node.label;

                    if (builderNodes.length) {
                        builderNodes.forEach(function (child) {
                            var childAdded = child.buildRequest(builder, objToAdd, node.module);
                            added = added || childAdded;
                        });
                    } else  { 
                        added = true;
                    }



                    if (added && (checkEmptyContainer(node.parent ? node.parent.type : 'blanktype', objToAdd) || checkPresence(node))) {
                        builder.insertPropertyToObj(req, labelWithModule, objToAdd);
                    }

                    return added;
                };

                node.fill = function (name, data) {
                    var match = comparePropToElemByName(name, node.label),
                        nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    if (match && nodesToFill.length) {
                        nodesToFill.forEach(function (child) {
                            for (var prop in data) {
                                child.fill(prop, data[prop]);
                            }
                        });

                        node.expanded = match;
                    }

                    return match;
                };

                node.clear = function () {
                    var nodesToClear = node.getChildren(null, null, constants.NODE_UI_DISPLAY);
                    node.nodeType = constants.NODE_UI_DISPLAY;

                    if (nodesToClear.length) {
                        nodesToClear.forEach(function (child) {
                            child.clear();
                        });
                    }
                };

                node.isFilled = function () {
                    return node.getChildren(null, null, constants.NODE_UI_DISPLAY).some(function (child) {
                        return child.isFilled();
                    });
                };
            },
            rpc: function (node) {
                node.expanded = true;
                node.buildRequest = function (builder, req, module) {
                    var added = false,
                        name = node.label,
                        objToAdd = builder.createObj(),
                        builderNodes = node.getChildren(null, null, constants.NODE_UI_DISPLAY),
                        labelWithModule = (module !== node.module ? node.module + ':' : '') + node.label;

                    if (builderNodes.length) {
                        builderNodes.forEach(function (child) {
                            var childAdded = child.buildRequest(builder, objToAdd, node.module);
                            added = added || childAdded;
                        });
                    } else {
                        added = true;
                        objToAdd = constants.NULL_DATA;
                    }

                    if (added) {
                        builder.insertPropertyToObj(req, labelWithModule, objToAdd);
                    }

                    return added;
                };

                node.fill = function (name, data) {
                    var filled = false,
                        nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    nodesToFill.forEach(function (child) {
                        var childFilled = child.fill(name, data);
                        filled = filled || childFilled;
                    });

                    node.expanded = filled;

                    return filled;
                };

                node.clear = function () {
                    var nodesToClear = node.getChildren(null, null, constants.NODE_UI_DISPLAY);
                    
                    if (nodesToClear.length) {
                        nodesToClear.forEach(function (child) {
                            child.clear();
                        });
                    }
                };

                node.isFilled = function () {
                    return node.getChildren(null, null, constants.NODE_UI_DISPLAY).some(function (child) {
                        return child.isFilled();
                    });
                };

            },
            input: function (node) {
                node.expanded = true;

                node.buildRequest = function (builder, req, module) {
                    var added = false,
                        name = node.label,
                        objToAdd = builder.createObj(),
                        builderNodes = node.getChildren(null, null, constants.NODE_UI_DISPLAY),
                        labelWithModule = (module !== node.module ? node.module + ':' : '') + node.label;

                    if (builderNodes.length) {

                        builderNodes.forEach(function (child) {
                            var childAdded = child.buildRequest(builder, objToAdd, node.module);
                            added = added || childAdded;
                        });
                    } else {
                        added = true;
                    }

                    if (added) {
                        builder.insertPropertyToObj(req, labelWithModule, objToAdd);
                    }

                    return added;
                };

                node.fill = function (name, data) {
                    var match = comparePropToElemByName(name, node.label),
                        nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    if (match && nodesToFill.length) {
                        nodesToFill.forEach(function (child) {
                            for (var prop in data) {
                                child.fill(prop, data[prop]);
                            }
                        });
                        node.expanded = match;
                    }

                    return match;
                };

                node.clear = function () {
                    var nodesToClear = node.getChildren(null, null, constants.NODE_UI_DISPLAY);
                    
                    if (nodesToClear.length) {
                        nodesToClear.forEach(function (child) {
                            child.clear();
                        });
                    }
                };

                node.isFilled = function () {
                    return node.getChildren(null, null, constants.NODE_UI_DISPLAY).some(function (child) {
                        return child.isFilled();
                    });
                };

            },
            output: function (node) {
                node.expanded = true;

                node.buildRequest = function (builder, req) {
                    // var added = false,
                    //     name = node.label,
                    //     objToAdd = builder.createObj(),
                    //     builderNodes = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    // if (builderNodes.length) {
                    //     builderNodes.forEach(function (child) {
                    //         var childAdded = child.buildRequest(builder, objToAdd);
                    //         added = added || childAdded;
                    //     });
                    // } else {
                    //     added = true;
                    // }

                    // if (added) {
                    //     builder.insertPropertyToObj(req, name, objToAdd);
                    // }

                    // return added;
                };

                node.fill = function (name, data) {
                    var match = comparePropToElemByName(name, node.label),
                        nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    if (match && nodesToFill.length) {
                        nodesToFill.forEach(function (child) {
                            for (var prop in data) {
                                child.fill(prop, data[prop]);
                            }
                        });
                        node.expanded = match;
                    }

                    return match;
                };

                node.clear = function () {
                    var nodesToClear = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    if (nodesToClear.length) {
                        nodesToClear.forEach(function (child) {
                            child.clear();
                        });
                    }
                };

                node.isFilled = function () {
                    return node.getChildren(null, null, constants.NODE_UI_DISPLAY).some(function (child) {
                        return child.isFilled();
                    });
                };

            },
            case: function (node) {

                node.buildRequest = function (builder, req, module) {
                    var added = false;

                    node.getChildren(null, null, constants.NODE_UI_DISPLAY).forEach(function (child) {
                        var childAdded = child.buildRequest(builder, req, module);
                        added = added || childAdded;
                    });

                    return added;
                };

                node.fill = function (name, data) {
                    var filled = false,
                        nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    nodesToFill.forEach(function (child) {
                        var childFilled = child.fill(name, data);
                        filled = filled || childFilled;
                    });

                    return filled;
                };

                node.clear = function () {
                    var nodesToClear = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    nodesToClear.forEach(function (child) {
                        child.clear();
                    });
                };

                node.isFilled = function () {
                    return node.getChildren(null, null, constants.NODE_UI_DISPLAY).some(function (child) {
                        return child.isFilled();
                    });
                };
            },
            choice: function (node) {
                node.choice = null;
                node.expanded = true;

                node.buildRequest = function (builder, req, module) {
                    var added = false;

                    if (node.choice) {
                        added = node.choice.buildRequest(builder, req, module);
                    }

                    return added;
                };

                node.fill = function (name, data) {
                    var filled = false,
                            nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    nodesToFill.forEach(function (child) {
                        var childFilled = child.fill(name, data);

                        if (childFilled) {
                            node.choice = child;
                        }

                        filled = filled || childFilled;
                        if (filled) {
                            return false;
                        }
                    });

                    return filled;
                };

                node.clear = function () {
                    node.nodeType = constants.NODE_UI_DISPLAY;

                    if (node.choice) {
                        node.choice.clear();
                        node.choice = null;
                    }
                };

                node.isFilled = function () {
                    return node.choice !== null;
                };
            },
            'leaf-list': function (node) {
                node.value = [];
                node.expanded = true;

                node.toggleExpand = function () {
                    node.expanded = !node.expanded;
                };

                node.addListElem = function () {
                    var newElement = {
                        value: ''
                    };
                    node.value.push(newElement);
                };

                node.removeListElem = function (elem) {
                    node.value.splice(node.value.indexOf(elem), 1);
                };

                node.buildRequest = function (builder, req, module) {
                    var valueArray = [],
                        labelWithModule = (module !== node.module ? node.module + ':' : '') + node.label;

                    for (var i = 0; i < node.value.length; i++) {
                        valueArray.push(node.value[i].value);
                    }

                    if (valueArray.length > 0) {
                        builder.insertPropertyToObj(req, labelWithModule, valueArray);
                        return true;
                    }

                    return false;

                };


                node.fill = function (name, array) {
                    var match = comparePropToElemByName(name, node.label),
                            newLeafListItem;

                    if (match) {

                        for (var i = 0; i < array.length; i++) {
                            newLeafListItem = {
                                value: array[i]
                            };
                            node.value.push(newLeafListItem);
                        }

                    }
                    return match;
                };

                node.clear = function () {
                    node.nodeType = constants.NODE_UI_DISPLAY;
                    node.value = [];
                };

                node.isFilled = function () {
                    return node.value.length > 0;
                };

            },
            key: function (node) {
                // do this only on list, not on listElem because deepCopy on list doesn't copy property keys to listElem => don't do this when button for add new list is clicked
                if (node.parent.hasOwnProperty('refKey')) {
                    var keyLabels = node.label.split(' '),
                        keyNodes = node.parent.getChildren(null, null, constants.NODE_UI_DISPLAY).filter(function (child) {
                            return keyLabels.indexOf(child.label) > -1;
                        }),
                        getRefKeyArray = function(keys){
                            var refKeyArray = [];
                            keyLabels.forEach(function(keyLabel){
                                var nk = keys.filter(function(k){
                                    return keyLabel === k.label;
                                });

                                if ( nk.length ) {
                                    refKeyArray.push(nk[0]);
                                }
                            });
                            return refKeyArray;
                        };

                    node.parent.refKey = getRefKeyArray(keyNodes);
                }
            },
            config: function (node) {
                node.parent.isConfigStm = (node.label === 'true');
            },
            list: function (node) {
                node.refKey = [];
                node.doubleKeyIndexes = [];
                node.actElemStructure = null;
                node.actElemIndex = -1;
                node.listData = [];
                node.expanded = true;
                node.filters = [];
                node.filterNodes = [];
                node.searchedPath = [];
                node.referenceNode = null;
                node.filteredListData = [];
                node.currentFilter = 0;

                node.toggleExpand = function () {
                    node.expanded = !node.expanded;
                };

                node.createStructure = function () {
                    if (node.actElemStructure === null) {
                        var copy = node.deepCopy(['augmentionGroups', 'augmentationId']);
                        wrapper._listElem(copy);
                        node.actElemStructure = copy;
                        node.actElemStructure.getActElemIndex = node.getActElemIndex;
                    }
                };

                node.getActElemIndex = function() {
                    return node.actElemIndex;
                };

                node.addListElem = function () {
                    node.createStructure();
                    var newElemData = {};
                    node.listData.push(newElemData);
                    node.changeActElementData(node.listData.length - 1,true);
                };

                node.buildActElemData = function () {
                    var list = [],
                            result;
                    if (node.actElemStructure) {
                        node.actElemStructure.listElemBuildRequest(reqBuilder, list, node.module);
                        result = list[0] ? list[0] : {};
                    }
                    return result;
                };

                node.changeActElementData = function (index,fromAdd) {
                    var storeData = node.buildActElemData();
                    node.expanded = true;

                    if (node.actElemIndex > -1) { //we are changing already existing data
                        if(node.filteredListData && node.filteredListData.length){
                            node.listData[node.listData.indexOf(node.filteredListData[node.actElemIndex])] = storeData;
                            node.filteredListData[node.actElemIndex] = storeData;
                            if(fromAdd){
                               listFiltering.clearFilterData(node, true, false);
                            }
                        }else{
                            node.listData[node.actElemIndex] = storeData;
                        }
                    }
                    node.actElemIndex = index;

                    var actData = null;
                    if(!(node.filteredListData && node.filteredListData.length)){
                        actData = node.listData[node.actElemIndex];
                    }else{
                        actData = node.listData[node.listData.indexOf(node.filteredListData[node.actElemIndex])];
                    }

                    node.actElemStructure.clear();
                    for (var prop in actData) {
                        node.actElemStructure.fillListElement(prop, actData[prop]);
                    }

                    eventDispatcher.dispatch(constants.EV_LIST_CHANGED, node.actElemStructure);
                };

                node.removeListElem = function (elemIndex,fromFilter) {

                    if(fromFilter){
                        elemIndex = node.listData.indexOf(node.filteredListData[elemIndex]);
                    }

                    node.listData.splice(elemIndex, 1);
                    node.actElemIndex = node.listData.length - 1;

                    if(fromFilter){
                        listFiltering.clearFilterData(node,true,false);
                    }

                    if (node.actElemIndex === -1) {
                        node.actElemStructure = null;
                    } else {
                        var actData = node.listData[node.actElemIndex];

                        node.actElemStructure.clear();
                        for (var prop in actData) {
                            node.actElemStructure.fillListElement(prop, actData[prop]);
                        }
                    }

                    eventDispatcher.dispatch(constants.EV_LIST_CHANGED, node.actElemStructure);
                };

                node.buildRequest = function (builder, req, module) {
                    var added = false;
                    //store entered data
                    var storeData = node.buildActElemData(),
                        labelWithModule = (module !== node.module ? node.module + ':' : '') + node.label;

                    if (node.actElemIndex > -1) {
                        if(node.filteredListData && node.filteredListData.length){
                            node.listData[node.listData.indexOf(node.filteredListData[node.actElemIndex])] = storeData;
                            node.filteredListData[node.actElemIndex] = storeData;
                        }else{
                            node.listData[node.actElemIndex] = storeData;
                        }
                    }

                    added = node.listData.filter(function (data) {
                        return $.isEmptyObject(data) === false;
                    }).length > 0;

                    var buildedDataCopy = node.listData.slice().map(function (item) {
                                                var newItem = {};
                                                for(var prop in item){
                                                    if(prop != '$$hashKey'){
                                                        newItem[prop] = item[prop];
                                                    }
                                                }
                                                return newItem;
                                            }).filter(function(item){
                                                return Object.keys(item).length !== 0;
                                            });

                    // check of listElems keyValues duplicity
                    if(node.filteredListData && node.filteredListData.length){
                        node.doubleKeyIndexes = wrapper.checkKeyDuplicity(node.filteredListData, node.refKey);
                    }else{
                        node.doubleKeyIndexes = wrapper.checkKeyDuplicity(node.listData, node.refKey);
                    }

                    if (added) {
                        builder.insertPropertyToObj(req, labelWithModule, buildedDataCopy);
                    }

                    return added;
                };

                node.fill = function (name, array) { //data is array

                    var match = comparePropToElemByName(name, node.label);

                    if (match && array.length) {
                        node.createStructure();
                        node.listData = array.slice();
                        node.actElemIndex = node.listData.length - 1;
                        for (var prop in node.listData[node.actElemIndex]) {
                            node.actElemStructure.fillListElement(prop, node.listData[node.actElemIndex][prop]);
                        }
                    }

                    return (match && array.length > 0);
                };

                node.clear = function () {
                    while (node.listData.length > 0) {
                        node.listData.pop();
                    }
                    while (node.filteredListData.length > 0) {
                        node.filteredListData.pop();
                    }

                    node.actElemIndex = -1;
                    node.actElemStructure = null;
                    node.nodeType = constants.NODE_UI_DISPLAY;
                };

                node.isFilled = function () {
                    return node.listData.length > 0;
                };

                node.createListName = function (index) {
                    var name = '',
                        val = '';

                    if(node.filteredListData && node.filteredListData.length){
                        currentList = node.filteredListData;
                    }else{
                        currentList = node.listData;
                    }

                    if (index > -1) {
                        node.actElemStructure.refKey.forEach(function (key) {
                            var keyLabel = '';
                            if(index === node.getActElemIndex()) {
                                val = key.value !== '' ? key.label + ':' + key.value : '';
                            } else {
                                var prop = '';
                                if (!($.isEmptyObject(currentList[index]))) {
                                    if(currentList[index][key.label]) {
                                        prop = key.label;
                                    } else if(currentList[index][key.module + ':' + key.label]) {
                                        prop = key.module + ':' + key.label;
                                    }
                                    val = prop ? key.label + ':' + currentList[index][prop] : prop;
                                }
                            }

                            name = name ? (name + (val ? (' ' + val) : '')) : (name + (val ? (' <' + val) : ''));
                        });
                    }

                    if (name) {
                        name = name + '>';
                    }

                    return name;
                };

                node.getNewFilterElement = function (){
                    return node.getChildrenForFilter().map(function(element){
                            nodeWrapperForFilter.init(element);
                            var copy = element.deepCopyForFilter();
                            wrapper.wrapAll(copy);
                            nodeWrapperForFilter.wrapForFilter(copy);
                        return copy;
                    });
                };
            },
            _listElem: function (node) {
                node.refKey = [];

                node.listElemBuildRequest = function (builder, req, module) {
                    var added = false,
                        objToAdd = builder.createObj();

                    node.getChildren(null, null, constants.NODE_UI_DISPLAY).forEach(function (child) {
                        var childAdded = child.buildRequest(builder, objToAdd, node.module);
                        added = added || childAdded;
                    });

                    if (added) {
                        builder.insertObjToList(req, objToAdd);
                    }

                    return added;
                };

                node.fillListElement = function (name, data) {
                    var filled = false;

                    node.getChildren(null, null, constants.NODE_UI_DISPLAY).forEach(function (child) {
                        var childFilled = child.fill(name, data);
                        filled = filled || childFilled;
                    });

                    return filled;
                };

                node.isFilled = function () {
                    return node.getChildren(null, null, constants.NODE_UI_DISPLAY).some(function (child) {
                        return child.isFilled();
                    });
                };

                node.clear = function () {
                    var nodesToClear = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                    if (nodesToClear.length) {
                        nodesToClear.forEach(function (child) {
                            child.clear();
                        });
                    }
                };

                node.children.forEach(function (child) {
                    wrapper.wrapAll(child);
                });
            }
        };

        wrapper.__test = {
            comparePropToElemByName: comparePropToElemByName,
            equalArrays: equalArrays,
            equalListElems: equalListElems,
            parseRestrictText: parseRestrictText,
            getTypes: getTypes,
            checkListElemKeys: checkListElemKeys
        };

        return wrapper;
    });

    yangUtils.factory('restrictionsFact', function () {

        var RestrictionObject = function(fnc, info) {
            this.info = info;
            this.check = fnc;
        };

        var convertToInteger = function(value) {
            var strVal = typeof value === 'string' ? value : value.toString(),
                radix = strVal.indexOf('0x') === 0 ? 16 : strVal.indexOf('0') === 0 ? 8 : 10;

            return parseInt(strVal, radix);
        };

        var restrictions = {};

        restrictions.getEqualsFnc = function (target) {
            var intTarget = parseInt(target);
            
            return new RestrictionObject(
                function (value) {
                    var intVal = convertToInteger(value);
                    return intVal === intTarget;
                },
                'Value must be equal to '+target
            );
        };

        restrictions.getMinMaxFnc = function (min, max) {
            var intMin = parseInt(min),
                intMax = parseInt(max);
            
            return new RestrictionObject(
                function (value) {
                    var intVal = convertToInteger(value);
                    return (intMin <= intVal) && (intVal <= intMax);
                },
                'Value must be in between '+min+' and '+max
            );
        };

        restrictions.getReqexpValidationFnc = function (patternString) {
            return new RestrictionObject(
                function (value) {
                    var pattern = new RegExp(patternString);
                    return pattern.test(value.toString());
                },
                'Value must match '+patternString
            );
        };

        restrictions.getIsNumberFnc = function () {
            return new RestrictionObject(
                function (value) {
                    var pattern = new RegExp('^[+-]?((0x[0-9A-Fa-f]+)|(0[0-9]+)|([0-9]+))$');
                    return pattern.test(value.toString());
                },
                'Value must be number (+/-, 0x and 0) prefixed are permitted'
            );
        };

        restrictions.getIsUNumberFnc = function () {
            return new RestrictionObject(
                function (value) {
                    var pattern = new RegExp('^[+]?((0x[0-9A-Fa-f]+)|(0[0-9]+)|([0-9]+))$');
                    return pattern.test(value.toString());
                },
                'Value must be positive number (+, 0x and 0) prefixed are permitted'
            );
        };

        restrictions.getIsDecimalFnc = function () {
            return new RestrictionObject(
                function (value) {
                    var pattern = new RegExp("^[-]?[1-9]?[0-9]+[.|,]?[0-9]*$");
                    return pattern.test(value.toString());
                },
                'Value must be decimal number - prefix is permitted'
            );
        };

        restrictions.isInArray = function (array) {
            return new RestrictionObject(
                function (value) {
                    return array.some(function(arrVal) {
                        return arrVal === value;
                    });
                },
                'Value must be in ' + array.toString()
            );
        };


        return restrictions;
    });

    yangUtils.factory('yinParser', ['$http','syncFact', 'constants', 'arrayUtils', 'pathUtils', 'YangUIApis', 'nodeUtils', 
        function ($http, syncFact, constants, arrayUtils, pathUtils, YangUIApis, nodeUtils) {
        var augmentType = 'augment';
        var path = './assets';

        var Module = function (name, revision, namespace) {
            this._name = name;
            this._revision = revision;
            this._namespace = namespace;
            this._statements = {};
            this._roots = [];
            this._augments = [];

            this.getRoots = function () {
                return this._roots;
            };

            this.getImportByPrefix = function (prefix) {
                var importNode = null;

                if (this._statements.hasOwnProperty('import')) {
                    importNode = this._statements.import.filter(function (importItem) {
                        return importItem._prefix === prefix;
                    })[0];
                }

                return importNode;
            };

            this.getRawAugments = function () {
                return this._augments;
            };

            this.getAugments = function () {
                var self = this;

                return this.getRawAugments().map(function (augNode) {
                    var prefixConverter = function (prefix) {
                            var importNode = self.getImportByPrefix(prefix);
                            return importNode ? importNode.label : null;
                        },
                        getDefaultModule = function() {
                            return null;
                        };

                    augNode.path = pathUtils.translate(augNode.pathString, prefixConverter, self._statements.import, getDefaultModule);

                    return new Augmentation(augNode);
                });
            };

            this.addChild = function (node) {
                if (!this._statements.hasOwnProperty(node.type)) {
                    this._statements[node.type] = [];
                }

                var duplicates = this._statements[node.type].filter(function (item) {
                    return node.label === item.label && node.nodeType === item.nodeType;
                });

                if (duplicates && duplicates.length > 0) {
                    console.warn('trying to add duplicate node', node, 'to module', this._statements);
                } else {
                    this._statements[node.type].push(node);

                    if (nodeUtils.isRootNode(node.type)) {
                        this._roots.push(node);
                    }

                    if (node.type === 'augment') {
                        this._augments.push(node);
                    }
                }
            };

            this.searchNode = function (type, name) {
                var searchResults = null,
                        searchedNode = null;

                if (this._statements[type]) {
                    searchResults = this._statements[type].filter(function (node) {
                        return name === node.label;
                    });
                }

                if (searchResults && searchResults.length === 0) {
                    //console.warn('no nodes with type', type, 'and name', name, 'found in', this);
                } else if (searchResults && searchResults.length > 1) {
                    //console.warn('multiple nodes with type', type, 'and name', name, 'found in', this);
                } else if (searchResults && searchResults.length === 1) {
                    searchedNode = searchResults[0];
                }

                return searchedNode;
            };
        };

        var Node = function (id, name, type, module, namespace, parent, nodeType, moduleRevision) {
            this.id = id;
            this.label = name;
            this.localeLabel = constants.LOCALE_PREFIX + name.toUpperCase();
            this.type = type;
            this.module = module;
            this.children = [];
            this.parent = parent;
            this.nodeType = nodeType;
            this.namespace = namespace;
            this.moduleRevision = moduleRevision;

            this.appendTo = function (parentNode) {
                parentNode.addChild(this);
            };

            this.addChild = function (node) {
                if (this.children.indexOf(node) === -1) {
                    this.children.push(node);
                    node.parent = this;
                }
                
            };

            this.deepCopy = function deepCopy(additionalProperties) {
                var copy = new Node(this.id, this.label, this.type, this.module, this.namespace, null, this.nodeType, this.moduleRevision),
                    self = this;

                additionalProperties = (additionalProperties || []).concat(['pathString']);

                additionalProperties.forEach(function(prop) {
                    if (prop !== 'children' && self.hasOwnProperty(prop) && copy.hasOwnProperty(prop) === false) {
                        copy[prop] = self[prop];
                    }
                });

                this.children.forEach(function (child) {
                    var childCopy = child.deepCopy(additionalProperties);
                    childCopy.parent = copy;
                    copy.children.push(childCopy);
                });
                return copy;
            };

            this.getCleanCopy = function(){
                return new Node(this.id, this.label, this.type, this.module, this.namespace, null, this.nodeType, this.moduleRevision);
            };

            this.getChildren = function (type, name, nodeType, property) {
                var filteredChildren = this.children.filter(function (item) {
                    return (name != null ? name === item.label : true) && (type != null ? type === item.type : true) && (nodeType != null ? nodeType === item.nodeType : true);
                });

                if (property) {
                    return filteredChildren.filter(function (item) {
                        return item.hasOwnProperty(property);
                    }).map(function (item) {
                        return item[property];
                    });
                } else {
                    return filteredChildren;
                }
            };

        };



        var AugmentationsGroup = function(){
            this.obj = {};

            this.addAugumentation = function(augumentation){
                this.obj[augumentation.id] = augumentation;
            };
        };

        var Augmentations = function(){
            this.groups = {};

            this.addGroup  = function(groupId){
                this.groups[groupId] = !this.groups.hasOwnProperty(groupId) ? new AugmentationsGroup() : this.groups[groupId];
            };

            this.getAugmentation = function(node, augId) {
                return this.groups[node.module + ':' + node.label] ? this.groups[node.module + ':' + node.label].obj[augId] : null;
            };
        };

        var Augmentation = function (node) {
            var self = this;
            this.node = node;
            this.path = (node.path ? node.path : []);
            this.id = node.module + ':' + node.label;
            this.expanded = true;
            // AUGMENT FIX
            //node.label = node.module + ':' + node.label;


            this.toggleExpand = function () {
                this.expanded = !this.expanded;
            };

            this.setAugmentationGroup = function(targetNode, augumentations){
                var targetNodeId = targetNode.module + ':' + targetNode.label;
                targetNode.augmentionGroups = targetNode.augmentionGroups ? targetNode.augmentionGroups : [];
                targetNode.augmentionGroups.push(self.id);

                augumentations.addGroup(targetNodeId);
                augumentations.groups[targetNodeId].addAugumentation(self);
            };

            this.apply = function (nodeList, augumentations) {
                var targetNode = this.getTargetNodeToAugment(nodeList);

                if (targetNode) {
                    this.setAugmentationGroup(targetNode, augumentations);

                    this.node.children.forEach(function (child) {
                        child.appendTo(targetNode);
                        child.augmentationId = self.id;
                        // AUGMENT FIX
                        // child.children.forEach(function (moduleChild) {
                        //     moduleChild.label = moduleChild.module + ':' + moduleChild.label;
                        // });
                    });
                } else {
                    console.warn('can\'t find target node for augmentation ', this.getPathString());
                }
            };

            this.getTargetNodeToAugment = function (nodeList) {
                return pathUtils.search({children: nodeList}, this.path.slice());
            };

            this.getPathString = function () {
                return this.path.map(function (elem) {
                    return elem.module + ':' + elem.name;
                }).join('/');
            };

        };

        var parentTag = function (xml) {
            if (xml.get(0).tagName.toLowerCase() === 'module') {
                return xml.get(0);
            } else {
                return parentTag(xml.parent());
            }
        };

        var parseModule = function(data, callback) {
            var yangParser = new YangParser();

            var moduleName = $($.parseXML(data).documentElement).attr('name'),
                moduleNamespace = $($.parseXML(data)).find('namespace').attr('uri'),
                moduleoduleRevision = $($.parseXML(data)).find('revision').attr('date'),
                moduleObj = new Module(moduleName, moduleoduleRevision, moduleNamespace);

            yangParser.setCurrentModuleObj(moduleObj);
            yangParser.parse($.parseXML(data).documentElement, moduleObj);

            yangParser.sync.waitFor(function () {
                callback(moduleObj);
            });
        };

        var loadStaticModule = function(name, callback, errorCbk) {
            var yinPath = '/yang2xml/' + name + '.yang.xml';
            $http.get(path + yinPath).success(function(data) {
                    console.warn('cannot load '+ name + 'from controller, trying loading from static storage');
                    parseModule(data, callback);
            }).error(function() {
                console.warn('cannot load file '+ yinPath + 'from static storage');
                errorCbk();
                return null;
            });
        };

        var parseYangMP = function parseYangMP(baseApiPath, name, rev, callback, errorCbk) {
            var path = baseApiPath + '/' + name + '/' + rev + '/schema';

            YangUIApis.getSingleModuleInfo(path).then(
                function (data) {
                    if($.parseXML(data) !== null) {
                        parseModule(data, callback);
                    } else {
                        loadStaticModule(name, callback, errorCbk);
                    }
                }, function () {
                    loadStaticModule(name, callback, errorCbk);
                }
            );
        };

        var parseYang = function parseYang(name, rev, callback, errorCbk) {
            YangUIApis.getModuleSchema(name, rev).get().then(
                function (data) {
                    if($.parseXML(data) !== null) {
                        parseModule(data, callback);
                    } else {
                        loadStaticModule(name, callback, errorCbk);
                    }
                }, function () {
                    loadStaticModule(name, callback, errorCbk);
                }
            );
        };

        var YangParser = function () {
            this.rootNodes = [];
            this.nodeIndex = 0;
            this.sync = syncFact.generateObj();
            this.moduleObj = null;

            this.setCurrentModuleObj = function (moduleObj) {
                this.moduleObj = moduleObj;
            };

            this.createNewNode = function (name, type, parentNode, nodeType) {
                var node = new Node(this.nodeIndex++, name, type, this.moduleObj._name, this.moduleObj._namespace, parentNode, nodeType, this.moduleObj._revision);

                if (parentNode) {
                    parentNode.addChild(node);
                }

                return node;
            };

            this.parse = function (xml, parent) {
                var self = this;

                $(xml).children().each(function (_, item) {
                    var prop = item.tagName.toLowerCase();
                    if (self.hasOwnProperty(prop)) {
                        self[prop](item, parent);
                    } else {
                        // self.parse(this, parent);
                    }
                });
            };

            this.config = function(xml, parent) {
                var type = 'config',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);
            };

            this.presence = function(xml, parent) {
                var type = 'presence',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);
            };

            this.leaf = function (xml, parent) {
                var type = 'leaf',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this['leaf-list'] = function (xml, parent) {
                var type = 'leaf-list',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.container = function (xml, parent) {
                var type = 'container',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.choice = function (xml, parent) {
                var type = 'choice',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.case = function (xml, parent) {
                var type = 'case',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.list = function (xml, parent) {
                var type = 'list',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };


            this.key = function (xml, parent) {
                var type = 'key',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.description = function (xml, parent) {
                var type = 'description',
                    name = $(xml).attr('text') ? $(xml).attr('text') : $(xml).children('text:first').text(),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.typedef = function (xml, parent, typedefName) {
                var type = 'typedef',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_LINK_TARGET,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.grouping = function (xml, parent, groupingName) {
                var type = 'grouping',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_LINK_TARGET,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.uses = function (xml, parent) {
                var type = 'uses',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_LINK,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.import = function (xml, parent) {
                var type = 'import',
                    name = $(xml).attr('module'),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);

                node._prefix = $(xml).children('prefix:first').attr('value');
                node._revisionDate = $(xml).children('revision-date:first').attr('date');
            };

            this.augment = function (xml, parent) {
                var type = augmentType,
                    nodeType = constants.NODE_ALTER,
                    augmentIndentifier = $(xml).children("ext\\:augment-identifier:first").attr("ext:identifier"),
                    name = augmentIndentifier ? augmentIndentifier : 'augment' + (this.nodeIndex + 1).toString(),
                    pathString = $(xml).attr('target-node'),
                    augmentRoot = this.createNewNode(name, type, parent, nodeType);

                augmentRoot.pathString = pathString;
                this.parse(xml, augmentRoot);
            };


            this.rpc = function (xml, parent) {
                var type = 'rpc',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.input = function (xml, parent) {
                var type = 'input',
                    name = 'input',
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.output = function (xml, parent) {
                var type = 'output',
                    name = 'output',
                    nodeType = constants.NODE_UI_DISPLAY,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.pattern = function (xml, parent) {
                var type = 'pattern',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_RESTRICTIONS;

                this.createNewNode(name, type, parent, nodeType);
            };

            this.range = function (xml, parent) {
                var type = 'range',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_RESTRICTIONS;

                this.createNewNode(name, type, parent, nodeType);
            };

            this.length = function (xml, parent) {
                var type = 'length',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_RESTRICTIONS;

                this.createNewNode(name, type, parent, nodeType);
            };

            this.enum = function (xml, parent) {
                var type = 'enum',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_ALTER;

                this.createNewNode(name, type, parent, nodeType);
            };

            this.bit = function (xml, parent) {
                var type = 'bit',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };

            this.position = function (xml, parent) {
                var type = 'position',
                    name = $(xml).attr('value'),
                    nodeType = constants.NODE_ALTER;

                this.createNewNode(name, type, parent, nodeType);
            };

            this.type = function (xml, parent) {
                var type = 'type',
                    name = $(xml).attr('name'),
                    nodeType = constants.NODE_ALTER,
                    node = this.createNewNode(name, type, parent, nodeType);

                this.parse(xml, node);
            };
        };

        return {
            parseYang: parseYang,
            parseYangMP: parseYangMP,
            yangParser: new YangParser(),
            Augmentations: Augmentations,
            Module: Module,
            __test: {
                path: path,
                parentTag: parentTag,
                yangParser: new YangParser(),
                Augmentation: Augmentation,
                Module: Module
            }
        };
    }]);

    yangUtils.factory('apiBuilder', function (arrayUtils, pathUtils, nodeUtils, YangUtilsRestangular) {

        var ab = {};

        var Api = function(basePath, module, revision, subApis) {
            this.basePath = basePath;
            this.module = module;
            this.revision = revision;
            this.subApis = subApis || [];

            this.addSubApis = function(subApis) {
                var self = this;
                subApis.forEach(function(sa) {
                    sa.parent = self;
                    self.subApis.push(sa);
                });
            };
        };

        var SubApi = function (pathTemplateString, operations, node, storage, parent) {
            this.node = node;
            this.pathTemplateString = pathTemplateString;
            this.operations = operations;
            this.storage = storage;
            this.custFunct = [];
            this.parent = parent ? parent : null;

            this.pathArray = (function(st, path) {
                var pathString = (st ? st + '/' : '') + path;
                return pathUtils.translate(pathString);
            }) (this.storage, this.pathTemplateString);

            this.equals = function(pathArray, compareIdentifierValues) {
                return this.pathArray.every(function(pa, i) {
                    pa.equals(pathArray[i], compareIdentifierValues);
                });
            };

            this.buildApiRequestString = function () {
                return pathUtils.translatePathArray(this.pathArray).join('/');
            };

            this.addCustomFunctionality = function (label, callback, viewStr, hideButtonOnSelect) {
                var funct = custFunct.createNewFunctionality(label, this.node, callback, viewStr, hideButtonOnSelect);

                if (funct) {
                    this.custFunct.push(funct);
                }
            };

            this.clone = function(options) {
                var getOption = function(optName) {
                        var res = null;
                        if(options) {
                            res = options[optName] || null;
                        }
                        return  res;
                    },
                    clone = new SubApi(getOption('pathTemplateString') || this.pathTemplateString, 
                                       getOption('operations') || this.operations, 
                                       getOption('withoutNode') ? null : this.node, 
                                       getOption('storage') || this.storage, 
                                       getOption('parent') || this.parent);

                if(getOption('clonePathArray')) {
                    clone.pathArray = this.pathArray.map(function(pe) {
                        return pe.clone();
                    });
                }
                
                return clone;
            };
        };

        var removeDuplicatedApis = function(apis) {
            var toRemove = [],
                sortApisByRevision = function(a, b) {
                    var dateA = new Date(a.revision+'Z'),
                        dateB = new Date(b.revision+'Z');

                    return dateB - dateA;
                };

            apis.forEach(function(a) {
                if(toRemove.indexOf(a) === -1) {
                    var sortedApis = apis.filter(function(af) {
                        return a.module === af.module;
                    }).sort(sortApisByRevision);

                    toRemove = toRemove.concat(sortedApis.slice(1));
                }
            });

            toRemove.forEach(function(a) {
                apis.splice(apis.indexOf(a), 1);
            });

            return apis;
        };

        var isConfigNode = function(node) {
            var result = false;

            if(node.hasOwnProperty('isConfigStm')) {
                result = node.isConfigStm;
            } else if(node.parent) {
                result = isConfigNode(node.parent);
            }

            return result;
        };

        var addNodePathStr = function(node) {
            return (!node.parent || (node.parent.module !== node.module) ? node.module + ':' : '') + node.label;
        };

        var getBasePath = function() {
            return YangUtilsRestangular.configuration.baseUrl + '/restconf/';
        };

        var getApiByModuleRevision = function(apis, module, revision) {
            return apis.filter(function(a) {
                return a.module === module && a.revision === revision;
            })[0];
        };

        var getKeyIndentifiers = function(keys) {
            return keys.map(function (k) {
                return '{' + k.label + '}';
            });
        };

        var getStoragesByNodeType = function(node) {
            var storages = [];
            if(nodeUtils.isRootNode(node.type)) {
                if(node.type === 'rpc') {
                    storages.push('operations');
                } else {
                    storages.push('operational');
                    if(isConfigNode(node)) {
                        storages.push('config');
                    }
                }
            }

            return storages;
        };

        var getOperationsByStorage = function(storage) {
            var operations =  [];
            if(storageOperations.hasOwnProperty(storage)) {
                operations = storageOperations[storage];
            }

            return operations;
        };

        storageOperations = {};

        storageOperations.config = ['GET', 'PUT', 'POST', 'DELETE'];
        storageOperations.operational = ['GET'];
        storageOperations.operations = ['POST'];

        var nodePathStringCreator = {};

        nodePathStringCreator.list = function(node, pathstr) {
            return pathstr + addNodePathStr(node) + '/' + (node.refKey.length ? (getKeyIndentifiers(node.refKey).join('/') + '/') : '');
        };

        nodePathStringCreator.container = function(node, pathstr) {
            return pathstr + addNodePathStr(node) + '/';
        };

        nodePathStringCreator.rpc = function(node, pathstr) {
            return pathstr + addNodePathStr(node) + '/';
        };

        var createSubApis = function(node, pathstr) {
            var storages = getStoragesByNodeType(node);

            return storages.map(function(storage) {
                var subApi = new SubApi(pathstr, getOperationsByStorage(storage), node, storage);
                return subApi;
            });
        };

        var nodeChildrenProcessor = function(node, pathstr, subApis) {
            if(nodeUtils.isRootNode(node.type) && nodePathStringCreator.hasOwnProperty(node.type)) {
                var templateStr = nodePathStringCreator[node.type](node, pathstr),
                    newSubApis = createSubApis(node, templateStr);

                arrayUtils.pushElementsToList(subApis, newSubApis);

                node.children.forEach(function(ch) {
                    nodeChildrenProcessor(ch, templateStr, subApis);
                });
            }
        };

        //utility function
        printApis = function(apis) {
            var co = '';
            apis.forEach(function(a) {
                a.subApis.forEach(function(sa) {
                    co += (sa.storage + '/' + sa.pathTemplateString + '\n');
                });
            });

            // console.info(co);
        };

        ab.processAllRootNodes = function(nodes) {
            var apis = [];

            nodes.forEach(function(node) {
                var api = getApiByModuleRevision(apis, node.module, node.moduleRevision),
                    newApi = false;

                if(!api) {
                    api = new Api(getBasePath(), node.module, node.moduleRevision);
                    newApi = true;
                }

                api.addSubApis(ab.processSingleRootNode(node));

                if(newApi) {
                    apis.push(api);
                }
            });

            apis = removeDuplicatedApis(apis);

            printApis(apis);

            return apis;
        };

        ab.processSingleRootNode = function(node) {
            var templateStr = nodePathStringCreator[node.type](node, ''),
                subApis = createSubApis(node, templateStr);

            node.children.forEach(function(ch) {
                nodeChildrenProcessor(ch, templateStr, subApis);
            });

            return subApis;
        };

        ab.Api = Api;
        ab.SubApi = SubApi;

        return ab;
    });

    yangUtils.factory('moduleConnector', function (constants) {

        var isBuildInType = function (type) {
            return ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64',
                    'decimal64', 'string', 'boolean', 'enumeration', 'bits', 'binary',
                    'leafref', 'identityref', 'empty', 'union', 'instance-identifier'].indexOf(type) > -1;
        };

        moduleConnector = {};

        var linkFunctions = {};
        linkFunctions.uses = function (usesNode, currentModule) {
            var targetType = 'grouping';
            return function (modules) {
                var data = findLinkedStatement(usesNode, targetType, currentModule, modules),
                    node = data.node,
                    module = data.module,
                    changed = false;

                if (node && module) {
                    usesNode.parent.children.splice(usesNode.parent.children.indexOf(usesNode), 1); //delete uses node
                    for (var i = 0; i < node.children.length; i++) {
                        applyLinks(node.children[i], module, modules);
                    }
                    appendChildren(usesNode.parent, node);
                    changed = true;
                }

                return changed;
            };
        };

        linkFunctions.type = function (typeNode, currentModule) {
            var targetType = 'typedef';

            if (isBuildInType(typeNode.label) === false) {
                return function (modules) {
                    var data = findLinkedStatement(typeNode, targetType, currentModule, modules),
                        node = data.node ? data.node.getChildren('type')[0] : null,
                        changed = false;

                    if (node) {
                        typeNode.parent.children.splice(typeNode.parent.children.indexOf(typeNode), 1); //delete referencing type node
                        typeNode.parent.addChild(node);
                        changed = true;
                    }

                    return changed;
                };
            } else {
                return function (modules) {
                    return false;
                };
            }
        };

        findLinkedStatement = function (node, targetType, currentModule, modules) {
            var sourceNode,
                sourceModule,
                link = node.label;

            if (link.indexOf(':') > -1) {
                var parts = link.split(':'),
                    targetImport = currentModule.getImportByPrefix(parts[0]);

                sourceModule = targetImport ? searchModule(modules, targetImport.label, targetImport.revisionDate) : null;
                sourceNode = sourceModule ? sourceModule.searchNode(targetType, parts[1]) : null;
            } else {
                sourceModule = searchModule(modules, node.module, node.moduleRevision);
                sourceNode = sourceModule ? sourceModule.searchNode(targetType, link) : null;
            }

            return {node: sourceNode, module: sourceModule};
        };

        var appendChildren = function (targetNode, sourceNode) {
            sourceNode.children.forEach(function (child) {
                targetNode.addChild(child);
            });
        };

        var searchModule = function (modules, moduleName, moduleRevision) {
            var searchResults = modules.filter(function (item) {
                    return (moduleName === item._name && (moduleRevision ? moduleRevision === item._revision : true));
                }),
                targetModule = (searchResults && searchResults.length) ? searchResults[0] : null;

            return targetModule;
        };
        var applyLinks = function (node, module, modules) {
            var changed = false;
            if (linkFunctions.hasOwnProperty(node.type)) { //applying link function to uses.node
                changed = linkFunctions[node.type](node, module)(modules);
            }

            for (var i = 0; i < node.children.length; i++) {
                if (applyLinks(node.children[i], module, modules)) {
                    i--; //need to repeat current index because we are deleting uses nodes, so in case there are more uses in row, it would skip second one
                }
            }

            return changed;
        };

        var interConnectModules = function (modules) {
            var rootNodes = [],
                augments = [];

            modules.forEach(function (module) {
                module.getRoots().concat(module.getRawAugments()).forEach(function (node) {
                    applyLinks(node, module, modules);
                });
            });

            modules.forEach(function (module) {
                module._roots = module.getRoots().map(function (node) {
                    copy = node.deepCopy();
                    return applyModuleRevision(copy, module._name, module._revision);
                });

                module._augments = module.getRawAugments().map(function (node) {
                    copy = node.deepCopy();
                    return applyModuleRevision(copy, module._name, module._revision);
                });
            });

            return modules;
        };

        var applyModuleRevision = function (node, module, revision) {
            node.module = module;
            node.moduleRevision = revision;

            node.children.map(function (child) {
                return applyModuleRevision(child, module, revision);
            });

            return node;
        };

        moduleConnector.processModuleObjs = function (modules) {
            var rootNodes = [],
                augments = [],
                connectedModules = interConnectModules(modules.slice());

            connectedModules.forEach(function (module) {
                rootNodes = rootNodes.concat(module.getRoots());
                augments = augments.concat(module.getAugments());
            });

            return {rootNodes: rootNodes, augments: augments};
        };

        moduleConnector.__test = {
            isBuildInType: isBuildInType,
            linkFunctions: linkFunctions,
            findLinkedStatement: findLinkedStatement,
            appendChildren: appendChildren,
            searchModule: searchModule,
            applyLinks: applyLinks,
            interConnectModules: interConnectModules,
            applyModuleRevision: applyModuleRevision
        };

        return moduleConnector;
    });

    yangUtils.factory('dataBackuper', function () {
        var bck = {};

        bck.storedData = {};

        var getKey = function(key) {
            return key || 'DEFAULT';
        };

        bck.storeFromScope = function(variables, scope, key) {
            var data = {};
            key = getKey(key);

            variables.forEach(function(k) {
                if(scope.hasOwnProperty(k)) {
                    data[k] = scope[k];
                } else {
                    console.warn('scope doesn\'t have variable',k);
                }
            });
            bck.storedData[key] = data;
        };

        bck.getToScope = function(variables, scope, key) {
            var data = {};

            key = getKey(key);
            if(bck.storedData.hasOwnProperty(key)) {
                data = bck.storedData[key];

                variables.forEach(function(k) {
                    if(data.hasOwnProperty(k)) {
                        scope[k] = data[k];
                    } else {
                        console.warn('storet data doesn\'t have variable',k);
                    }
                });
            }
        };

        return bck;
    });

    yangUtils.factory('mountPointsConnector', function (YangUIApis, nodeWrapper, yangUtils, constants, eventDispatcher, apiBuilder, yinParser, pathUtils) {

        var mountPrefix = constants.MPPREFIX,
            mountPointLabel = 'Mount point';

        mp = {};

        mp.createMPRootNode = function(mpNodes) {
            var node = null,
                yangParser = yinParser.yangParser;

            yangParser.setCurrentModuleObj(new yinParser.Module('yang-ext', null, null));
            node = yangParser.createNewNode('mount','container',null, constants.NODE_UI_DISPLAY);
            nodeWrapper.wrapAll(node);

            node.buildRequest = function (builder, req, module) {
              var added = false,
                  name = node.label,
                  builderNodes = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

              if (builderNodes.length) {
                  builderNodes.forEach(function (child) {
                      var childAdded = child.buildRequest(builder, req, module);
                  });
              }

              return added;
            };

            node.fill = function(name, data) {
                var nodesToFill = node.getChildren(null, null, constants.NODE_UI_DISPLAY);

                nodesToFill.forEach(function (child) {
                    var childFilled = child.fill(name, data);
                });
            };


            mpNodes.forEach(function(mp){
                node.addChild(mp);
            });

            return node;
        };

        var addPathElemsToPathArray = function(pathElems, pathArray, index) {
            var updatedPath = pathArray.slice();

            pathElems.forEach(function(pe, offset) {
                // pe.disabled = true; //add disabled flag so user won't be able to change it in the UI
                updatedPath.splice(index + offset, 0, pe);
            });

            return updatedPath;
        };

        mp.alterMpPath = function(path) {
            var pathParts = path.split('/'),
                restconfIndex = pathUtils.findIndexOfStrInPathStr(pathParts, 'restconf'),
                mpIndex = pathUtils.findIndexOfStrInPathStr(pathParts, mountPrefix),
                mpPath = path.slice(),
                mpPathParts = '';

            if(mpIndex !== -1){
                mpPathParts = pathParts.slice(mpIndex);

                var unshiftIndex = restconfIndex !== -1 ? restconfIndex + 1 : 0;

                mpPathParts.unshift(pathParts[unshiftIndex]);
                mpPath = mpPathParts.join('/');
            }

            return mpPath;
        };

        //function for adding path to mountpoint + yang:ext-mount to mount point patharray so the request string will be built correctly
        mp.updateMountPointApis = function(basePathArray, mpApis) {
            var actualPath = basePathArray.slice(1); //we don't want to have config/operational storage in path
            // actualPath.push(pathUtils.createPathElement(mountPrefix, null, null, false)); //we want to push yang-ext:mount to the path - not if we have yang-ext:mount rootNode

            mpApis.forEach(function(api) {
                api.subApis.forEach(function(subApi) {
                    subApi.pathArray = addPathElemsToPathArray(actualPath, subApi.pathArray, 1);
                });
            });
        };

        mp.getMPModulesAPI = function(api) {
            var apiArray = api.split('/'),
                yangExtMountStr = mountPrefix;

            if(apiArray[apiArray.length - 1] !== yangExtMountStr) {
                apiArray.push(yangExtMountStr);
            }

            return apiArray.slice(1).join('/');
        };

        mp.discoverMountPoints = function(api, getModulesCbk, callback) {
            var modulesCbk = getModulesCbk || function() { return []; },
                mpNodes = [],
                baseApiPath = mp.getMPModulesAPI(api);
                
            YangUIApis.getCustomModules(baseApiPath).then(
                function (data) {
                    yangUtils.processModulesMP(data.modules, baseApiPath, function (result, augments) {
                        eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Linking modules to Apis');
                        var allRootNodes = result.map(function (node) {
                            var copy = node.deepCopy(['augmentionGroups', 'augmentationId']);

                            nodeWrapper.wrapAll(copy);
                            return copy;
                        });

                        var moduleNames = data.modules.module.map(function(m) {
                            return m.name;
                        });

                        allRootNodes.forEach(function(n) {
                            if(moduleNames.indexOf(n.module) > -1 && ['container','list'].indexOf(n.type) > -1) {
                                mpNodes.push(n);
                            }
                        });

                        console.info('loaded mount point nodes', mpNodes);
                        callback(mpNodes, augments);
                    });
                }, function (result) {
                    console.error('Error getting Mount point data:', result);
                    callback([]);
                }
            );
        };
        
        mp.createCustomButton = function(label, show, click){
            return {
                label: label, 
                show: show,
                onclick: click
            };
        };
        

        return mp;
    });

    yangUtils.factory('yangUtils', function (yinParser, nodeWrapper, reqBuilder, syncFact, constants, pathUtils, moduleConnector, YangUIApis, eventDispatcher, apiBuilder) {

        var utils = {};

        utils.stripAngularGarbage = function(obj, prop) {
            var strippedObj = {},
                propsToRemove = ['$$hashKey', 'route', 'reqParams', 'parentResource', 'restangularCollection'],
                removeGarbage = function(obj) {
                    propsToRemove.forEach(function(p) {
                        delete obj[p];
                    });

                    return obj;
                };

            if(obj.hasOwnProperty(prop)) {
                strippedObj[prop] = obj[prop];
            } else {
                strippedObj = removeGarbage(obj);
            }

            return strippedObj;
        };

        utils.switchConfigOper = function(apiStr, swtichTo) {
            var c = 'config',
                o = 'operational',
                str = apiStr;

            if(apiStr.indexOf(c) === 0) {
                str = swtichTo + apiStr.slice(c.length);
            } else if(apiStr.indexOf(o) === 0) {
                str =  swtichTo + apiStr.slice(o.length);
            } 

            return str;
        };

        utils.generateNodesToApis = function (callback, errorCbk) {
            var allRootNodes = [],
                topLevelSync = syncFact.generateObj(),
                reqAll = topLevelSync.spawnRequest('all'),
                allAugmentationGroups = {};

            YangUIApis.getAllModules().get().then(
                function (data) {
                    utils.processModules(data.modules, function (result, aGroups) {
                        allAugmentationGroups = aGroups;
                        allRootNodes = result.map(function (node) {
                            var copy = node.deepCopy(['augmentionGroups', 'augmentationId']);

                            nodeWrapper.wrapAll(copy);
                            return copy;
                        });
                        topLevelSync.removeRequest(reqAll);
                    });
                }, function (result) {
                    console.error('Error getting API data:', result);
                    topLevelSync.removeRequest(reqAll);
                }
            );

            topLevelSync.waitFor(function () {
                try {
                    eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Building apis');
                    var abApis = apiBuilder.processAllRootNodes(allRootNodes);
                    callback(abApis, allRootNodes, allAugmentationGroups);
                } catch (e) {
                    errorCbk(e);
                    throw(e); //do not lose debugging info
                }
            });

        };

        utils.generateApiTreeData = function (apis) {
            var newElem = function (pathElem, array) {
                    var getIdentifierStr = function(path){
                            return path.identifiers.map(function(identifier){
                                return '{' + identifier.label + '}';
                            }).join(' ');
                        },
                        element = {
                            label: pathElem.name,
                            module: pathElem.module,
                            identifier: pathElem.hasIdentifier() ? getIdentifierStr(pathElem) : '',
                            identifiersLength: pathElem.identifiers.length,
                            children: []
                        };

                    array.push(element);
                },
                fillPath = function (path, array, indexSubApi, indexApi, itemSub, childIndex) {
                    var existElem = false,
                        arrayIndex = null,
                        currentPathItem = path[childIndex],
                        continueProcessing = false;

                    if (childIndex < path.length) {
                        if (array.length > 0) {
                            existElem = array.some(function (arrayItem, index) {
                                var condition = arrayItem.label === currentPathItem.name;
                                if (condition) {
                                    arrayIndex = index;
                                }

                                return condition;
                            });

                            if (!existElem) {
                                newElem(currentPathItem, array);
                            }
                        } else {
                            newElem(currentPathItem, array);
                        }

                        arrayIndex = arrayIndex !== null ? arrayIndex : array.length - 1;
                        var isContinuing = fillPath(path, array[arrayIndex].children, indexSubApi, indexApi, itemSub, childIndex+1);
                        if (isContinuing === false) {
                            array[arrayIndex].indexApi = indexApi;
                            array[arrayIndex].indexSubApi = indexSubApi;
                        }

                        continueProcessing = true;
                    }

                    return continueProcessing;
                },
                getApisAndPath = function (item, indexApi) {
                    var childrenArray = [];

                    item.subApis.map(function (itemSub, indexSubApi) {
                        var childIndex = 0;
                        fillPath(itemSub.pathArray, childrenArray, indexSubApi, indexApi, itemSub, childIndex);
                    });

                    return childrenArray;
                },
                dataTree = apis.map(function (item, indexApi) {
                    var apisPath = getApisAndPath(item, indexApi);

                    return {
                        label: item.module + (item.revision ? ' rev.' + item.revision : ''),
                        module: item.module,
                        revision: item.revision,
                        children: apisPath
                    };
                }),
                sortedDataTree = dataTree.sort(function(a, b) {
                    var sortRes = 0;
                    if(a.label < b.label) {
                        sortRes = -1;
                    }
                    if(a.label > b.label) {
                        sortRes = 1;
                    }
                    return sortRes;
                });

            return sortedDataTree;
        };

        utils.processModules = function (loadedModules, callback) {
            var modules = [],
                rootNodes = [],
                augments = [],
                syncModules = syncFact.generateObj(),
                augmentionGroups = new yinParser.Augmentations();

            eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Processing modules');
            loadedModules.module.forEach(function (module) {
                var reqId = syncModules.spawnRequest(module.name);

                yinParser.parseYang(module.name, module.revision, function (module) {
                    modules.push(module);
                    syncModules.removeRequest(reqId);
                }, function () {
                    syncModules.removeRequest(reqId);
                });
            });

            syncModules.waitFor(function () {
                eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Linking uses and typedefs');
                processedData = moduleConnector.processModuleObjs(modules);
                rootNodes = processedData.rootNodes;
                augments = processedData.augments;

                eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Linking augments');

                var sortedAugments = augments.sort(function (a, b) {
                    return a.path.length - b.path.length;
                });

                sortedAugments.map(function (elem) {
                    elem.apply(rootNodes, augmentionGroups);
                });

                callback(rootNodes, augmentionGroups);
            });
        };

        utils.processModulesMP = function (loadedModules, basePath, callback) {
            var modules = [],
                rootNodes = [],
                augments = [],
                syncModules = syncFact.generateObj(),
                augmentionGroups = new yinParser.Augmentations();

            eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Processing modules');
            loadedModules.module.forEach(function (module) {
                var reqId = syncModules.spawnRequest(module.name);
                
                yinParser.parseYangMP(basePath, module.name, module.revision, function (module) {
                    modules.push(module);
                    syncModules.removeRequest(reqId);
                }, function () {
                    syncModules.removeRequest(reqId);
                });
            });

            syncModules.waitFor(function () {
                eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Linking uses and typedefs');
                processedData = moduleConnector.processModuleObjs(modules);
                rootNodes = processedData.rootNodes;
                augments = processedData.augments;

                eventDispatcher.dispatch(constants.EV_SRC_MAIN, 'Linking augments');

                var sortedAugments = augments.sort(function (a, b) {
                    return a.path.length - b.path.length;
                });

                sortedAugments.map(function (elem) {
                    elem.apply(rootNodes, augmentionGroups);
                });

                callback(rootNodes, augmentionGroups);
            });
        };

        utils.getRequestString = function (node) {
            var request = reqBuilder.createObj(),
                reqStr = '';

            node.buildRequest(reqBuilder, request, node.module);

            if (request && $.isEmptyObject(request) === false) {
                reqStr = reqBuilder.resultToString(request);
            }
            return reqStr;
        };

        utils.transformTopologyData = function (data, callback) {
            var links = [],
                nodes = [],
                getNodeIdByText = function getNodeIdByText(inNodes, text) {
                    var nodes = inNodes.filter(function (item, index) {
                        return item.label === text;
                    }),
                            nodeId;

                    if (nodes.length > 0 && nodes[0]) {
                        nodeId = nodes[0].id;
                    } else {
                        return null;
                    }

                    return nodeId;
                };


            if (data['network-topology'] && data['network-topology'].topology.length) {
                var topoData = callback ? callback(data['network-topology'].topology) : data['network-topology'].topology[0],
                    nodeId = 0,
                    linkId = 0;

                nodes = topoData.hasOwnProperty('node') ? topoData.node.map(function (nodeData) {
                    return {'id': (nodeId++).toString(), 'label': nodeData["node-id"], group: nodeData["node-id"].indexOf('host') === 0 ? 'host' : 'switch', value: 20, title: 'Name: <b>' + nodeData["node-id"] + '</b><br>Type: Switch'};
                }) : [];

                links = topoData.hasOwnProperty('link') ? topoData.link.map(function (linkData) {
                    var srcId = getNodeIdByText(nodes, linkData.source["source-node"]),
                            dstId = getNodeIdByText(nodes, linkData.destination["dest-node"]),
                            srcPort = linkData.source["source-tp"],
                            dstPort = linkData.destination["dest-tp"];
                    if (srcId != null && dstId != null) {
                        return {id: (linkId++).toString(), 'from': srcId, 'to': dstId, title: 'Source Port: <b>' + srcPort + '</b><br>Dest Port: <b>' + dstPort + '</b>'};
                    }
                }) : [];
            }

            return {nodes: nodes, links: links};
        };

        utils.objectHandler = function(obj, objCbk, vauleCbk, arrayCbk){
            if ( Array.isArray(obj) ) {
              if (angular.isFunction(arrayCbk)) {
                arrayCbk(obj);
              }
                  
              obj.forEach(function(item){
                utils.objectHandler(item, objCbk, vauleCbk);
              });
            } else {
              if ( obj !== null && Object.keys(obj).length > 0 && typeof obj !== 'string' ) {
                  if (angular.isFunction(objCbk)) {
                    objCbk(obj);
                  }

                  for(var property in obj){
                    utils.objectHandler(obj[property], objCbk, vauleCbk);
                  }
              } else {
                if (angular.isFunction(vauleCbk)) {
                  vauleCbk(obj);
                }
              }
            }
        };

        var checkSupApiIdentifiers = function(subApi){
                var pathElement = subApi.pathArray[subApi.pathArray.length-1];
                return pathElement.hasIdentifier() ? pathElement.identifiers : [];
            },
            postRequestData = function(requestData, reqString, subApi){
                var identifiersArray = checkSupApiIdentifiers(subApi),
                    lastPathElement = function(path){
                        return path.split('/').pop().split(':').pop();
                    };

                if ( identifiersArray.length ) {
                    var pathArray = reqString.split('/'),
                        reqObj = null;

                    identifiersArray.forEach(function(){
                        pathArray.pop();
                    });

                    reqString = pathArray.join('/');
                    requestItem = requestData[lastPathElement(reqString)] ? requestData[lastPathElement(reqString)].filter(function(item){
                        return identifiersArray.every(function(i){
                                    return item[i.label] === i.value;
                                });
                      }) : [];
                    
                    return requestItem.length ? requestItem[0] : {};
                } else {
                    return requestData[lastPathElement(reqString)];
                }
            };

        utils.prepareRequestData = function(requestData, operation, reqString, subApi){
            var preparedData = requestData;

            if(operation === 'GET'){
                preparedData = null;
            }
            else if(operation === 'POST'){
                return postRequestData(requestData, reqString, subApi);
            }

            return preparedData;
        };

        utils.prepareOperation = function(operation){
            return operation === 'DELETE' ? 'REMOVE' : operation;
        };

        utils.prepareHeaders = function(requestData){
            return requestData === constants.NULL_DATA ? { "Content-Type": undefined} : { "Content-Type": "application/yang.data+json"};
        };

        utils.errorMessages = {
            'method' : 
                    {
                        'GET': {
                            '401':'YANGUI_ERROR_GET_401',
                            '403':'YANGUI_ERROR_GET_403',
                            '404':'YANGUI_ERROR_GET_404',
                            '500':'YANGUI_ERROR_GET_500',
                            '503':'YANGUI_ERROR_GET_503'
                        },
                        'POST': {
                            '500':'YANGUI_ERROR_GET_500',
                            '503':'YANGUI_ERROR_GET_503'
                        },
                        'PUT': {
                            '500':'YANGUI_ERROR_GET_500',
                            '503':'YANGUI_ERROR_GET_503'
                        },
                        'DELETE': {
                            '500':'YANGUI_ERROR_GET_500',
                            '503':'YANGUI_ERROR_GET_503'
                        }
                    }
            };

        utils.__test = {
        };

        return utils;

    });

    yangUtils.factory('constants', function () {
        return  {
            NODE_UI_DISPLAY: 1,
            NODE_ALTER: 2,
            NODE_CONDITIONAL: 3,
            NODE_RESTRICTIONS: 4,
            NODE_LINK: 5,
            NODE_LINK_TARGET: 6,
            LOCALE_PREFIX: 'YANGUI_FORM_',
            EV_SRC_MAIN: 'EV_SRC_MAIN',
            EV_FILL_PATH: 'EV_FILL_PATH',
            EV_LIST_CHANGED: 'EV_LIST_CHANGED',
            EV_PARAM_EDIT_SUCC: 'EV_PARAM_EDIT_SUCC',
            MPPREFIX: 'yang-ext:mount',
            NULL_DATA: null
        };
    });

    yangUtils.factory('designUtils', function () {
        var d = {};

        d.setDraggablePopups = function(){
            $( ".draggablePopup" ).draggable({
                opacity: 0.35,
                containment: "#page-wrapper",
                cancel: 'pre, input, textarea, span, select'
            });

            $(function() {
                $( ".resizable-se" ).resizable({ handles: 'se' });
                $( ".resizable-s" ).resizable({ handles: 's', minHeight: 200 });
              });
        };

        d.getHistoryPopUpWidth = function(){
            var getWidth = function(){
                return $('.topologyContainer.previewContainer.historyPopUp').width();
            };


            if ( getWidth() !== null ) {
                $('.topologyContainer.previewContainer.historyPopUp').css({'marginLeft':'-'+(getWidth()/2)+'px'});
            }
        };

        d.triggerWindowResize = function (timeout) {
            var t = timeout ? timeout : 1;

            setTimeout(function(){
                $(window).trigger('resize');
            }, t);


        };

        return d;
    });

    yangUtils.factory('handleFile', function () {
        var f = {};

        f.downloadFile = function(filename, data, format, charset, successCbk, errorCbk){
            try{
                var blob = new Blob([data], { type:"application/"+format+"; "+charset+";"});
                downloadLink = angular.element("<a></a>");

                downloadLink.attr('href', window.URL.createObjectURL(blob));
                downloadLink.attr('download', filename);
                downloadLink[0].click();
                successCbk();
             }catch(e) {
                errorCbk(e);
             }
        };

        return f;
    });
});

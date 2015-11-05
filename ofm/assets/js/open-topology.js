// global
var one = {
    // global variables
    global : {
        remoteAddress : "http://odl.cloudistic.me:8080/"
    },
    role : null
}

// one ui library
one.lib = {};

// registry
one.lib.registry = {};

/** DASHLET */
one.lib.dashlet = {
    empty : function($dashlet) {
        $dashlet.empty();
    },
    append : function($dashlet, $content) {
        $dashlet.append($content);
    },
    header : function(header) {
        var $h4 = $(document.createElement('h4'));
        $h4.text(header);
        return $h4;
    },
    label : function(name, type) {
        var $span = $(document.createElement('span'));
        $span.addClass('label');
        if (type !== undefined) {
            $span.addClass(type);
        } else if (type !== null) {
            $span.addClass('label-info');
        }
        $span.append(name);
        return $span;
    },
    list : function(list) {
        var $ul = $(document.createElement('ul'));
        $(list).each(function(index, value) {
            var $li = $(document.createElement('li'));
            $li.append(value);
            $ul.append($li);
        });
        return $ul;
    },
    button : {
        config : function(name, id, type, size) {
            var button = {};
            button['name'] = name;
            button['id'] = id;
            button['type'] = type;
            button['size'] = size;
            return button;
        },
        single : function(name, id, type, size) {
            var buttonList = [];
            var button = one.lib.dashlet.button.config(name, id, type, size);
            buttonList.push(button);
            return buttonList;
        },
        button : function(buttonList) {
            var $buttonGroup = $(document.createElement('div'));
            $buttonGroup.addClass("btn-group");
            $(buttonList).each(function(index, value) {
                var $button = $(document.createElement('button'));
                $button.text(value.name);
                $button.addClass('btn');
                $button.addClass(value['type']);
                $button.addClass(value['size']);
                if (!(typeof value.id === 'undefined')) {
                    $button.attr('id', value.id);
                }
                $buttonGroup.append($button);
            });
            return $buttonGroup;
        }
    },
    datagrid: {
        /*
         * The init function returns HTML markup for the datagrid per the options provided. Each consumer 
         * of the datagrid must first call init and then provide the datasource for the grid.   
         * id: this is the id of the table
         * options: {
         * searchable: true/false,
         * pagination: turned off for now,
         * flexibleRowsPerPage: turned off
         * }
         * classes : String containing bootstrap related classes. For ex: "table-striped table-condensed"
         * The classes "table", "table-bordered" and "datagrid" will be added by default
         */
        init: function(id, options, classes) {
            var $fuelGridContainerDiv = $(document.createElement("div"));
            $fuelGridContainerDiv.addClass("fuelux");
            $table = $(document.createElement("table"));
            $table.attr("id", id);
            $table.addClass("table table-bordered datagrid");
            $table.addClass(classes);
            // create datagrid header
            $thead = $(document.createElement("thead"));
            $headertr = $(document.createElement("tr"));
            $headerth = $(document.createElement("th"));
            // create datagrid footer
            $tfoot = $(document.createElement("tfoot"));
            $footertr = $(document.createElement("tr"));
            $footerth = $(document.createElement("th"));
            if(options.searchable == true) {
                $headerth.append(one.lib.dashlet.datagrid._searchable());
            }
            if(options.flexibleRowsPerPage == true) {
                $footerth.append(one.lib.dashlet.datagrid._rowsPerPage(options.popout));
            }
            if(options.pagination == true) {
                $footerth.append(one.lib.dashlet.datagrid._pagination());
            }
            $headertr.append($headerth);
            $thead.append($headertr);
            $footertr.append($footerth);
            $tfoot.append($footertr);
            $table.append($thead).append($tfoot);
            $fuelGridContainerDiv.append($table);
            return $fuelGridContainerDiv;
        },
        _searchable: function() {
            var searchHTML = "<div class='datagrid-header-left'><div class='input-append search datagrid-search'> <input type='text' class='input-medium' placeholder='Search'><button type='button' class='btn'><i class='icon-search'></i></button></div></div>";
            return searchHTML;
        },
        _pagination: function() {
            var html = '<div class="datagrid-footer-right" style="display:none;"><div class="grid-pager"><button type="button" class="btn grid-prevpage"><i class="icon-chevron-left"></i></button><span>Page</span> <div style="display:inline-block;"><input type="text" name="pagenumber" style="width:25px;margin-bottom:-10px;vertical-align:middle;margin-right:5px;"></div><span>of <span class="grid-pages"></span></span><button type="button" class="btn grid-nextpage"><i class="icon-chevron-right"></i></button></div></div>';
            return html;
        },
        _rowsPerPage: function(popout) {
            if(popout) {
                var html = '<div class="datagrid-footer-left" style="display:none;"><div class="grid-controls"><span><span class="grid-start"></span>-<span class="grid-end"></span> of <span class="grid-count"></span></span><div class="select grid-pagesize" data-resize="auto" style="visibility:hidden;"><button type="button" data-toggle="dropdown" class="btn dropdown-toggle"><span class="dropdown-label"></span><span class="caret"></span></button><ul class="dropdown-menu"><li data-value="10" data-selected="true"><a href="#">5</a></li><li data-value="10"><a href="#">10</a></li><li data-value="20"><a href="#">20</a></li><li data-value="50"><a href="#">50</a></li><li data-value="100"><a href="#">100</a></li></ul></div><span style="display:none;">Per Page</span></div></div>';
            } else {
                var html = '<div class="datagrid-footer-left" style="display:none;"><div class="grid-controls"><span><span class="grid-start"></span>-<span class="grid-end"></span> of <span class="grid-count"></span></span><div class="select grid-pagesize" data-resize="auto" style="visibility:hidden;"><button type="button" data-toggle="dropdown" class="btn dropdown-toggle"><span class="dropdown-label"></span><span class="caret"></span></button><ul class="dropdown-menu"><li data-value="5" data-selected="true"><a href="#">5</a></li><li data-value="10"><a href="#">10</a></li><li data-value="20"><a href="#">20</a></li><li data-value="50"><a href="#">50</a></li><li data-value="100"><a href="#">100</a></li></ul></div><span style="display:none;">Per Page</span></div></div>';
            }
            return html;
        }
    },
    table : {
        table : function(classes, id) {
            var $table = $(document.createElement('table'));
            $table.addClass("table");
            $(classes).each(function(index, value) {
                $table.addClass(value);
            });
            if (!(typeof id === 'undefined'))
                $table.attr("id", id);
            return $table;
        },
        header : function(headers) {
            var $thead = $(document.createElement('thead'));
            var $tr = $(document.createElement('tr'));
            $(headers).each(function(index, value) {
                $th = $(document.createElement('th'));
                $th.append(value);
                $tr.append($th);
            });
            $thead.append($tr);
            return $thead;
        },
        body : function(body, thead) {
            var $tbody = $(document.createElement('tbody'));
            // if empty
            if (body.length == 0 && !(typeof thead === 'undefined')) {
                var $tr = $(document.createElement('tr'));
                var $td = $(document.createElement('td'));
                $td.attr('colspan', thead.length);
                $td.text('No data available');
                $td.addClass('empty');
                $tr.append($td);
                $tbody.append($tr);
                return $tbody;
            }
            // else, populate as usual
            $(body).each(function(index, value) {
                var $tr = $(document.createElement('tr'));
                $.each(value, function(key, value) {
                    if (key == 'type') {
                        // add classes
                        $(value).each(function(index, value) {
                            $tr.addClass(value);
                        });
                    } else if (key == 'entry') {
                        // add entries
                        $(value).each(function(index, value) {
                            var $td = $(document.createElement('td'));
                            $td.append(value);
                            $tr.append($td);
                        });
                    } else {
                        // data field
                        $tr.attr('data-' + key, value);
                    }
                    $tbody.append($tr);
                });
            });
            return $tbody;
        }
    },
    description : function(description, horizontal) {
        var $dl = $(document.createElement('dl'));
        if (horizontal == true) {
            $dl.addClass("dl-horizontal");
        }
        $(description).each(function(index, value) {
            var $dt = $(document.createElement('dt'));
            $dt.text(value.dt);
            var $dd = $(document.createElement('dd'));
            $dd.text(value.dd);
            $dl.append($dt).append($dd);
        });
        return $dl;
    }
}

/** MODAL */
one.lib.modal = {
    // clone default modal
    clone : function(id) {
        var $clone = $("#modal").clone(true);
        $clone.attr("id", id);
        return $clone;
    },
    // populate modal
    populate : function($modal, header, $body, footer, ajax) {
      if (ajax === undefined && ajax !== false) {
        $.getJSON(one.global.remoteAddress + 'web.json'); // session check per modal
      }
        var $h3 = $modal.find("h3");
        $h3.text(header);

        var $modalBody = $modal.find(".modal-body");
        $modalBody.append($body);

        $(footer).each(function(index, value) {
            $modal.find(".modal-footer").append(value);
        });
    },
    // clone and populate modal
    spawn : function(id, header, $body, footer) {
        var $modal = one.lib.modal.clone(id);
        one.lib.modal.populate($modal, header, $body, footer);
        $modal.on('hide', function () {
            $('.modal-body').scrollTop(0);
        });
        return $modal;
    },
    // empty modal
    empty : function($modal) {
        $modal.find("h3").empty();
        $modal.find(".modal-body").empty();
        $modal.find(".modal-footer").empty();
    },
    // injection
    inject : {
        body : function($modal, $body) {
            $modal.find(".modal-body").empty();
            $modal.find(".modal-body").append($body);
        }
    }
}

/** FORM */
one.lib.form = {
    // create select-option form element
    select : {
        create : function(options, multiple, sort) {
            // assert - auto assign
            if (options == undefined)
                options = {};

            var $select = $(document.createElement('select'));
            if (multiple == true) {
                $select.attr("multiple", "multiple");
            }
            var optionArray = one.lib.form.select.options(options);

            // If specified, sort the option elements based on their text field
            if (sort == true && optionArray.length > 1) {
                var shifted = true;
                var limit = optionArray.length;
                while (shifted) {
                    shifted = false;
                    for ( var i = 1; i < limit; i++) {
                        if (optionArray[i - 1].text() > optionArray[i].text()) {
                            var swap = optionArray[i - 1];
                            optionArray[i - 1] = optionArray[i];
                            optionArray[i] = swap;
                            shifted = true;
                        }
                    }
                }
            }

            $(optionArray).each(function(index, value) {
                $select.append(value);
            });
            return $select;
        },
        options : function(options) {
            var result = [];
            $.each(options, function(key, value) {
                var $option = $(document.createElement('option'));
                $option.attr("value", key);
                $option.text(value);
                result.push($option);
            });
            return result;
        },
        empty : function($select) {
            $select.empty();
        },
        inject : function($select, options) {
            $select.empty();
            var options = one.lib.form.select.options(options);
            $select.append(options);
        },
        prepend : function($select, options) {
            var options = one.lib.form.select.options(options);
            $select.prepend(options);
        },
        bubble : function($select, bubble) {
            $($select.find("option")).each(function(index, value) {
                if ($(value).attr("value") == bubble) {
                    var option = $(value);
                    $(value).remove();
                    $select.prepend(option);
                    return;
                }
            });
        }
    },
    // create legend form element
    legend : function(name) {
        var $legend = $(document.createElement('legend'));
        $legend.text(name);
        return $legend;
    },
    // create label form element
    label : function(name) {
        var $label = $(document.createElement('label'));
        $label.text(name);
        return $label;
    },
    // create help block form element
    help : function(help) {
        var $help = $(document.createElement('span'));
        $help.text(help);
        $help.addClass("help-block");
        return $help;
    },
    // create generic text input
    input : function(placeholder) {
        var $input = $(document.createElement('input'));
        $input.attr('type', 'text');
        $input.attr('placeholder', placeholder);
        return $input;
    }
}

/** NAV */
one.lib.nav = {
    unfocus : function($nav) {
        $($nav.find("li")).each(function(index, value) {
            $(value).removeClass("active");
        });
    }
}

/** ALERT */
one.lib.alert = function(alert) {
    $("#alert p").text(alert);
    $("#alert").hide();
    $("#alert").slideToggle();
    clearTimeout(one.lib.registry.alert);
    one.lib.registry.alert = setTimeout(function() {
        $("#alert").slideUp();
    }, 8000);
}





one.main = {};

one.main.constants = {
  address : {
    menu : one.global.remoteAddress + "web.json",
    prefix : one.global.remoteAddress + "controller/web",
    save : one.global.remoteAddress + "save"
  }
}

one.main.menu = {
  registry : {
    load : false
  },
  load : function() {
    one.main.menu.ajax(function(data) {
      // reparse the ajax data
      var result = one.main.menu.data.menu(data);
      // transform into list to append to menu
      var $div = one.main.menu.menu(result);
      // append to menu
      $("#menu .nav").append($div.children());
      // binding all menu items
      var $menu = $("#menu .nav a");
      $menu.click(function() {
        if (one.main.menu.registry.load === true) {
          return false;
        }
        one.main.menu.registry.load = true;
        var href = $(this).attr('href').substring(1);
        one.main.page.load(href);
        var $li = $(this).parent();
        // reset all other active
        $menu.each(function(index, value) {
          $(value).parent().removeClass('active');
        });
        $li.addClass('active');
      });
      // reset or go to first menu item by default
      var currentLocation = location.hash;
      if (data[currentLocation.substring(1)] == undefined) {
        $($menu[0]).click();
      } else {
        $menu.each(function(index, value) {
          var menuLocation = $(value).attr('href');
          if (currentLocation == menuLocation) {
            $($menu[index]).click();
            return;
          }
        });
      }
    });
  },
  menu : function(result) {
    var $div = $(document.createElement('div'));
    $(result).each(function(index, value) {
      if (value != undefined) {
        var $li = $(document.createElement('li'));
        var $a = $(document.createElement('a'));
        $a.text(value['name']);
        $a.attr('href', '#' + value['id']);
        $li.append($a);
        $div.append($li);
      }
    });
    return $div;
  },
  ajax : function(successCallback) {
    $.getJSON(one.main.constants.address.menu, function(data) {
      successCallback(data);
    });
  },
  data : {
    menu : function(data) {
      var result = [];
      $.each(data, function(key, value) {
        var order = value['order'];
        if (order >= 0) {
          var name = value['name'];
          var entry = {
            'name' : name,
        'id' : key
          };
          result[order] = entry;
        }
      });
      return result;
    }
  }
}

one.main.page = {
  load : function(page) {
    if (one.f !== undefined && one.f.cleanUp !== undefined) {
      one.f.cleanUp();
    }
    // clear page related
    delete one.f;
    $('.dashlet', '#main').empty();
    $('.nav', '#main').empty();
    // fetch page's js
    $.getScript(one.main.constants.address.prefix+"/"+page+"/js/page.js")
      .success(function() {
        one.main.menu.registry.load = false;
      });

    $.ajaxSetup({
      data : {
        'x-page-url' : page
      }
    });
  },
  dashlet : function($nav, dashlet) {
    var $li = $(document.createElement('li'));
    var $a = $(document.createElement('a'));
    $a.text(dashlet.name);
    $a.attr('id', dashlet.id);
    $a.attr('href', '#');
    $li.append($a);
    $nav.append($li);
  }
}

one.main.admin = {
  id : {
    modal : {
      main : "one_main_admin_id_modal_main",
      close : "one_main_admin_id_modal_close",
      user : "one_main_admin_id_modal_user",
      add : {
        user : "one_main_admin_id_modal_add_user",
        close : "one_main_admin_id_modal_add_close",
        form : {
          name : "one_main_admin_id_modal_add_form_name",
          role : "one_main_admin_id_modal_add_form_role",
          password : "one_main_admin_id_modal_add_form_password",
          verify : "one_main_admin_id_modal_add_form_verify"
        }
      },
      remove : {
        user : "one_main_admin_id_modal_remove_user",
        close : "one_main_admin_id_modal_remove_close",
        password : 'one_main_admin_id_modal_remove_password'
      },
      modify : {
          user : "one_main_admin_id_modal_modify_user",
      },
      password : {
        modal : 'one_main_admin_id_modal_password_modal',
        submit : 'one_main_admin_id_modal_password_submit',
        cancel : 'one_main_admin_id_modal_password_cancel',
        form : {
          old : 'one_main_admin_id_modal_password_form_old',
          set : 'one_main_admin_id_modal_password_form_new',
          verify : 'one_main_admin_id_modal_password_form_verify'
        }
      }
    },
    add : {
      user : "one_main_admin_id_add_user"
    }
  },
  registry :{

  },
  address : {
    root : "/admin",
    users : "/users",
    modifyUser : "/user/modify",
    password : '/admin/users/password/'
  },
  modal : {
    initialize : function(callback) {
      var h3 = "Welcome " + $('#admin').text();
      var footer = one.main.admin.modal.footer();
      var $modal = one.lib.modal.spawn(one.main.admin.id.modal.main, h3,
          '', footer);

      // close binding
      $('#' + one.main.admin.id.modal.close, $modal).click(function() {
        $modal.modal('hide');
      });

      // body inject
      one.main.admin.ajax.users(function($body) {
        one.lib.modal.inject.body($modal, $body);
      });

      // modal show callback
      callback($modal);
    },
    footer : function() {
      var footer = [];
      var closeButton = one.lib.dashlet.button.single('Close', one.main.admin.id.modal.close, '', '');
      var $closeButton = one.lib.dashlet.button.button(closeButton);
      footer.push($closeButton);
      return footer;
    }
  },
  ajax : {
    users : function(callback) {
      $.getJSON(one.main.admin.address.root
          + one.main.admin.address.users, function(data) {
            var body = one.main.admin.data.users(data);
            one.main.admin.registry["users"] = data;
            var $body = one.main.admin.body.users(body);
            callback($body);
          });
    }
  },
  data : {
    users : function(data) {
      var body = [];
      $(data).each(function(index, value) {
        var tr = {};
        var entry = [];
        entry.push(value['user']);
        entry.push(value['roles']);
        tr['entry'] = entry;
        tr['id'] = value['user'];
        body.push(tr);
      });
      return body;
    }
  },
  body : {
    users : function(body) {
      var $div = $(document.createElement('div'));
      var $h5 = $(document.createElement('h5'));
      $h5.append("Manage Users");
      var attributes = [ "table-striped", "table-bordered",
          "table-hover", "table-cursor" ];
      var $table = one.lib.dashlet.table.table(attributes);
      var headers = [ "User", "Role" ];
      var $thead = one.lib.dashlet.table.header(headers);
      var $tbody = one.lib.dashlet.table.body(body);
      $table.append($thead).append($tbody);

      // bind table
      if (one.role < 2) {
        $table.find('tr').click(function() {
          var id = $(this).data('id');
          one.main.admin.remove.modal.initialize(id);
        });
      }

      // append to div
      $div.append($h5).append($table);

      if (one.role < 2) {
        var addUserButton = one.lib.dashlet.button.single("Add User",
            one.main.admin.id.add.user, "btn-primary", "btn-mini");
        var $addUserButton = one.lib.dashlet.button
          .button(addUserButton);
        $div.append($addUserButton);

        // add user binding
        $addUserButton.click(function() {
          one.main.admin.add.modal.initialize();
        });
      }

      return $div;
    }
  },
  remove : {
    modal : {
      initialize : function(id) {
        var h3 = "Manage user - " + id;
        var footer = one.main.admin.remove.footer();
        var $body = one.main.admin.remove.body();
        var $modal = one.lib.modal.spawn(one.main.admin.id.modal.user,
            h3, $body, footer);
        // close binding
        $('#'+one.main.admin.id.modal.remove.close, $modal).click(function() {
          $modal.modal('hide');
        });
        // close binding
        $('#'+one.main.admin.id.modal.modify.user, $modal).click(function() {
          one.main.admin.add.modal.initialize(id, true);
        });
        // remove binding
        $('#' + one.main.admin.id.modal.remove.user, $modal).click(function() {
          one.main.admin.remove.modal.ajax(id, function(result) {
            if (result.description == 'Success') {
              $modal.modal('hide');
              // body inject
              var $admin = $('#'+one.main.admin.id.modal.main);
              one.main.admin.ajax.users(function($body) {
                one.lib.modal.inject.body($admin, $body);
              });
            } else {
              alert("Failed to remove user: " + result.description);
            }
          });
        });
        // change password binding
        $('#' + one.main.admin.id.modal.remove.password, $modal).click(function() {
          one.main.admin.password.initialize(id, function() {
            $modal.modal('hide');
          });
        });
        $modal.modal();
      },
      ajax : function(id, callback) {
        $.post(one.main.admin.address.root + one.main.admin.address.users + '/' + id, function(data) {
          callback(data);
        });
      },
    },
    footer : function() {
      var footer = [];
      var removeButton = one.lib.dashlet.button.single("Remove User",
          one.main.admin.id.modal.remove.user, "btn-danger", "");
      var $removeButton = one.lib.dashlet.button.button(removeButton);
      footer.push($removeButton);
      var modifyButton = one.lib.dashlet.button.single("Change Role",
              one.main.admin.id.modal.modify.user, "btn-success", "");
      var $modifyButton = one.lib.dashlet.button.button(modifyButton);
      footer.push($modifyButton);
      var change = one.lib.dashlet.button.single('Change Password',
          one.main.admin.id.modal.remove.password, 'btn-success', '');
      var $change = one.lib.dashlet.button.button(change);
      footer.push($change);
      var closeButton = one.lib.dashlet.button.single("Close",
          one.main.admin.id.modal.remove.close, "", "");
      var $closeButton = one.lib.dashlet.button.button(closeButton);
      footer.push($closeButton);
      return footer;
    },
    body : function() {
      var $p = $(document.createElement('p'));
      $p.append('Select an action');
      return $p;
    },
  },
  add : {
    modal : {
      initialize : function(id, edit) {
        var h3 = edit? "Change Role of user " + id:"Add User";
        var footer = one.main.admin.add.footer(edit);
        var $body = one.main.admin.add.body(id, edit);
        var $modal = one.lib.modal.spawn(one.main.admin.id.modal.user,
            h3, $body, footer);
        // close binding
        $('#' + one.main.admin.id.modal.add.close, $modal).click(function() {
          $modal.modal('hide');
        });
        // add binding
        $('#' + one.main.admin.id.modal.add.user, $modal).click(function() {
          one.main.admin.add.modal.add($modal, edit, function(result) {
            if (result.description == 'Success') {
              $modal.modal('hide');
              // body inject
              var $admin = $('#'+one.main.admin.id.modal.main);
              one.main.admin.ajax.users(function($body) {
               one.lib.modal.inject.body($admin, $body);
              });
            } else {
              var action = edit? "edit" :"add";
              alert("Failed to "+ action +" user: "+result.description);
            }
          });
        });
        $modal.modal();
      },
      add : function($modal, edit, callback) {
        var user = {};
        user['user'] = $modal.find(
            '#' + one.main.admin.id.modal.add.form.name).val();
        if (!edit) {
            user['password'] = $modal.find(
                '#' + one.main.admin.id.modal.add.form.password).val();
        }
        roles = new Array();
        roles[0] = $modal.find(
            '#' + one.main.admin.id.modal.add.form.role).find(
              'option:selected').attr('value');
        user['roles'] = roles;

        if (!edit) {
            // password check
            var verify = $('#'+one.main.admin.id.modal.add.form.verify).val();
            if (user.password != verify) {
              alert('Passwords do not match');
              return false;
            }
        }
        var resource = {};
        resource['json'] = JSON.stringify(user);
        resource['action'] = 'add'

        one.main.admin.add.modal.ajax(resource, edit, callback);
      },
      ajax : function(data, edit, callback) {
          if(edit) {
            $.post(one.main.admin.address.root
              + one.main.admin.address.modifyUser, data, function(data) {
                callback(data);
              });
          } else {  
            $.post(one.main.admin.address.root
              + one.main.admin.address.users, data, function(data) {
                callback(data);
              });
          }
      }
    },
    body : function(id, edit) {
      var $form = $(document.createElement('form'));
      var $fieldset = $(document.createElement('fieldset'));
      var users = one.main.admin.registry["users"];
      var currentUser;
      if(edit) {
        $(users).each(function(index, val) {
             if(val.user == id){
            currentUser = val;
          }
        });
      }

      // user
      var $label = one.lib.form.label('Username');
      var $input = one.lib.form.input('Username');
      $input.attr('id', one.main.admin.id.modal.add.form.name);
      if(edit) {
         $input.attr("disabled",true);
         $input.val(id);
      }
      $fieldset.append($label).append($input);
      if(!edit) {
          // password
          var $label = one.lib.form.label('Password');
          var $input = one.lib.form.input('Password');
          $input.attr('id', one.main.admin.id.modal.add.form.password);
          $input.attr('type', 'password');
          $fieldset.append($label).append($input);
          // password verify
          var $label = one.lib.form.label('Verify Password');
          var $input = one.lib.form.input('Verify Password');
          $input.attr('id', one.main.admin.id.modal.add.form.verify);
          $input.attr('type', 'password');
          $fieldset.append($label).append($input);
      }
      // roles
      var $label = one.lib.form.label('Roles');
      var options = {
        "Network-Admin" : "Network Administrator",
        "Network-Operator" : "Network Operator"
      };
      var $select = one.lib.form.select.create(options);
      $select.attr('id', one.main.admin.id.modal.add.form.role);
      if(edit) {
          $select.children().each(function() {
                 this.selected = (this.text == options[currentUser.roles[0]]);
          });
      }

      $fieldset.append($label).append($select);
      $form.append($fieldset);
      return $form;
    },
    footer : function(edit) {
      var footer = [];

      var buttonText = edit ? "Update User" : "Add User";

      var addButton = one.lib.dashlet.button.single(buttonText,
          one.main.admin.id.modal.add.user, "btn-primary", "");
      var $addButton = one.lib.dashlet.button.button(addButton);
      footer.push($addButton);

      var closeButton = one.lib.dashlet.button.single("Close",
          one.main.admin.id.modal.add.close, "", "");
      var $closeButton = one.lib.dashlet.button.button(closeButton);
      footer.push($closeButton);

      return footer;
    }
  },
  password : {
    initialize : function(id, successCallback) {
      var h3 = 'Change Password';
      var footer = one.main.admin.password.footer();
      var $body = one.main.admin.password.body(id);;
      var $modal = one.lib.modal.spawn(one.main.admin.id.modal.password.modal,
          h3, $body, footer);

      // cancel binding
      $('#'+one.main.admin.id.modal.password.cancel, $modal).click(function() {
        $modal.modal('hide');
      });

      // change password binding
      $('#'+one.main.admin.id.modal.password.submit, $modal).click(function() {
        one.main.admin.password.submit(id, $modal, function(result) {
          if (result.success) {
            //if changed own password, enforce relogin
            if (id.trim() == $('#currentuser').val().trim()) {
                alert("Password changed successfully. Please re-login with your new password.");
                window.location = '/';
            }
          } else {
            alert(result.code+': '+result.description);
          }
        });
      });

      $modal.modal();
    },
    submit : function(id, $modal, callback) {
      var resource = {};
      resource.newPassword = $('#'+one.main.admin.id.modal.password.form.set, $modal).val();

      // verify password
      var verify = $('#'+one.main.admin.id.modal.password.form.verify, $modal).val();
      if (verify != resource.newPassword) {
        alert('Passwords do not match');
        return false;
      }

      resource.currentPassword = $('#'+one.main.admin.id.modal.password.form.old, $modal).val();

      $.post(one.main.admin.address.password+id, resource, function(data) {
        callback(data);
      });
    },
    body : function(id) {
      var $form = $(document.createElement('form'));
      var $fieldset = $(document.createElement('fieldset'));
      // user
      var $label = one.lib.form.label('Username');
      var $input = one.lib.form.input('');
      $input.attr('disabled', 'disabled');
      $input.val(id);
      $fieldset.append($label)
        .append($input);
      // old password
      var $label = one.lib.form.label('Old Password');
      var $input = one.lib.form.input('Old Password');
      $input.attr('id', one.main.admin.id.modal.password.form.old);
      $input.attr('type', 'password');
      $fieldset.append($label).append($input);
      // new password
      var $label = one.lib.form.label('New Password');
      var $input = one.lib.form.input('New Password');
      $input.attr('id', one.main.admin.id.modal.password.form.set);
      $input.attr('type', 'password');
      $fieldset.append($label).append($input);
      // verify new password
      var $label = one.lib.form.label('Verify Password');
      var $input = one.lib.form.input('Verify Password');
      $input.attr('id', one.main.admin.id.modal.password.form.verify);
      $input.attr('type', 'password');
      $fieldset.append($label).append($input);
      // return
      $form.append($fieldset);
      return $form;
    },
    footer : function() {
      var footer = [];
      var submit = one.lib.dashlet.button.single('Submit',
          one.main.admin.id.modal.password.submit, 'btn-primary', '');
      var $submit = one.lib.dashlet.button.button(submit);
      footer.push($submit);
      var cancel = one.lib.dashlet.button.single('Cancel',
          one.main.admin.id.modal.password.cancel, '', '');
      var $cancel = one.lib.dashlet.button.button(cancel);
      footer.push($cancel);
      return footer;
    }
  }
}

one.main.cluster = {
  id : { // one.main.cluster.id
    modal : 'one-main-cluster-id-modal',
    close : 'one-main-cluster-id-close',
    datagrid : 'one-main-cluster-id-datagrid'
  },
  initialize : function() {
    var h3 = 'Cluster Management';
    var footer = one.main.cluster.footer();
    var $body = '';
    var $modal = one.lib.modal.spawn(one.main.cluster.id.modal, h3, $body, footer); 

    // close
    $('#'+one.main.cluster.id.close, $modal).click(function() {
      $modal.modal('hide');
    });

    // body
    $.getJSON('/admin/cluster', function(data) {
      var $gridHTML = one.lib.dashlet.datagrid.init(one.main.cluster.id.datagrid, {
        searchable: true,
          filterable: false,
          pagination: true,
          flexibleRowsPerPage: true
      }, 'table-striped table-condensed table-cursor');
      var source = one.main.cluster.data(data);
      $gridHTML.datagrid({dataSource : source}).on('loaded', function() {
        $(this).find('tbody tr').click(function() {
          var $tr = $(this);
          if ($tr.find('td:nth-child(1)').attr('colspan') === '1') {
            return false;
          }
          var address = $tr.find('.ux-id').text();
          one.main.cluster.nodes.initialize(address);
        });
      });
      one.lib.modal.inject.body($modal, $gridHTML);
    });

    $modal.modal();
  },
  data : function(data) {
    var tdata = [];
    var registry = [];
    $(data).each(function(idx, controller) {
      var name = controller.name;
      var address = controller.address;
      var $registry = $(document.createElement('span'));
      $registry
      .append(JSON.stringify(address))
      .css('display', 'none')
      .addClass('ux-id');
    name = one.lib.dashlet.label(name, null)[0].outerHTML;
    name += $registry[0].outerHTML;
    if (controller.me === true) {
      var me = one.lib.dashlet.label('*', 'label-inverse')[0].outerHTML;
      name += '&nbsp;'+me;
    }
    if (controller.coordinator === true) {
      var coord = one.lib.dashlet.label('C')[0].outerHTML;
      name += '&nbsp;'+coord;
    }
    tdata.push({
      'controller' : name,
      'numNodes'   : controller.numConnectedNodes
    });
    });
    var source = new StaticDataSource({
        columns : [
            {
              property : 'controller',
                label : 'Controller',
                sortable : true
            },
            {
                property : 'numNodes',
                label    : 'Nodes',
                sortable : true
            }
        ],
        data : tdata,
        delay : 0
    });
    return source;
  },
  footer : function() {
    var footer = [];
    var close = one.lib.dashlet.button.single('Close', one.main.cluster.id.close, '', '');
    var $close = one.lib.dashlet.button.button(close);
    footer.push($close);
    return footer;
  }
}

one.main.cluster.nodes = {
  id : { // one.main.cluster.nodes.id
    modal : 'one-main-cluster-nodes-id-modal',
    close : 'one-main-cluster-nodes-id-close',
    datagrid : 'one-main-cluser-nodes-id-datagrid'
  },
  initialize : function(address) { // one.main.cluster.nodes.initialize
    var h3 = 'Connected Nodes';
    var footer = one.main.cluster.nodes.footer();
    var $body = '';
    var $modal = one.lib.modal.spawn(one.main.cluster.nodes.id.modal, h3, $body, footer);

    // close
    $('#'+one.main.cluster.nodes.id.close, $modal).click(function() {
      $modal.modal('hide');
    });

    // body
    $.getJSON('/admin/cluster/controller/'+address, function(data) {
      var $gridHTML = one.lib.dashlet.datagrid.init(one.main.cluster.nodes.id.datagrid, {
        searchable: true,
          filterable: false,
          pagination: true,
          flexibleRowsPerPage: true
      }, 'table-striped table-condensed');
      var source = one.main.cluster.nodes.data(data);
      $gridHTML.datagrid({dataSource : source});
      one.lib.modal.inject.body($modal, $gridHTML);
    });

    $modal.modal();
  },
  data : function(data) {
    var tdata = [];
    $(data).each(function(idx, val) {
      tdata.push({
        'node' : val.description
      });
    });
    var source = new StaticDataSource({
      columns : [
    {
      property : 'node',
        label : 'Node',
        sortable : true
    }
    ],
        data : tdata,
        delay : 0
    });
    return source;
  },
  footer : function() { // one.main.cluster.nodes.footer
    var footer = [];
    var close = one.lib.dashlet.button.single('Close', one.main.cluster.nodes.id.close, '', '');
    var $close = one.lib.dashlet.button.button(close);
    footer.push($close);
    return footer;
  }
}

one.main.dashlet = {
  left : {
    top : $("#left-top .dashlet"),
    bottom : $("#left-bottom .dashlet")
  },
  right : {
    bottom : $("#right-bottom .dashlet")
  }
}

/** BOOTSTRAP */
$(".modal").on('hidden', function() {
  $(this).remove();
});

$("#alert .close").click(function() {
  $("#alert").hide();
});

/** INIT */

// parse role
one.role = $('#admin').data('role');

// user admin
$("#admin").click(function() {
  one.main.admin.modal.initialize(function($modal) {
    $modal.modal();
  });
});

// cluster
$('#cluster').click(function() {
  one.main.cluster.initialize();
});

// save
$("#save").click(function() {
  $.post(one.main.constants.address.save, function(data) {
    if (data == "Success") {
      one.lib.alert("Configuration Saved");
    } else {
      one.lib.alert("Unable to save configuration: " + data);
    }
  });
});

// logout
$("#logout").click(function() {
  //location.href = "/logout";
});

// felix osgi runtime
$("#osgi").click(function() {
  window.open("/controller/osgi/system/console", '_newtab');
});

$.ajaxSetup({
  complete : function(xhr, textStatus) {
    var mime = xhr.getResponseHeader('Content-Type');
    alert(mime);
    if (mime.substring(0, 9) == 'text/html') {
      //location.href = '/';
    }
  }
});

/** MAIN PAGE LOAD */
one.main.menu.load();




/** COMMON * */
var labelType, useGradients, nativeTextSupport, animate;

(function() {
    var ua = navigator.userAgent, iStuff = ua.match(/iPhone/i)
            || ua.match(/iPad/i), typeOfCanvas = typeof HTMLCanvasElement, nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'), textSupport = nativeCanvasSupport
            && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
    // I'm setting this based on the fact that ExCanvas provides text support
    // for IE
    // and that as of today iPhone/iPad current text support is lame
    labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native'
            : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();

/** TOPOLOGY * */
one.topology = {};

one.topology.option = {
    navigation : function(enable, panning, zooming) {
        var option = {};
        option["enable"] = enable;
        option["panning"] = panning;
        option["zooming"] = zooming;
        return option;
    },
    node : function(overridable, color, height, dim) {
        var option = {};
        option["overridable"] = overridable;
        option["color"] = color;
        option["height"] = height;
        option["dim"] = dim;
        return option;
    },
    edge : function(overridable, color, lineWidth, epsilon) {
        var option = {};
        option["overridable"] = overridable;
        option["color"] = color;
        option["lineWidth"] = lineWidth;
        if (epsilon != undefined)
            option["epsilon"] = epsilon;
        return option;
    },
    label : function(style, node) {
        var marginTop, minWidth;
        if (node.data["$type"] == "switch") {
            marginTop = "42px";
            minWidth = "65px";
        } else if (node.data["$type"] == "host") {
            marginTop = "48px";
            minWidth = "";
        } else if (node.data["$type"].indexOf("monitor") == 0) {
            marginTop = "52px";
            minWidth = "";
        }
        style.marginTop = marginTop;
        style.minWidth = minWidth;
        style.background = "rgba(68,68,68,0.7)";
        style.borderRadius = "4px";
        style.color = "#fff";
        style.cursor = "default";
    }
};

one.topology.init = function(json) {
    console.log(json);
    alert("json");
    if (json.length == 0) {
        $div = $(document.createElement('div'));
        $img = $(document.createElement('div'));
        $img.css('height', '128px');
        $img.css('width', '128px');
        $img.css('background-image', 'url(/img/topology_view_1033_128.png)');
        $img.css('clear', 'both');
        $img.css('margin', '0 auto');
        $p = $(document.createElement('p'));
        $p.addClass('text-center');
        $p.addClass('text-info');
        $p.css('width', '100%');
        $p.css('padding', '10px 0');
        $p.css('cursor', 'default');
        $p.append('No Network Elements Connected');
        $div.css('position', 'absolute');
        $div.css('top', '25%');
        $div.css('margin', '0 auto');
        $div.css('width', '100%');
        $div.css('text-align', 'center');
        $div.append($img).append($p);
        $("#topology").append($div);
        return false;
    }
    alert("topology.graph");
    one.topology.graph = new $jit.MultiTopology(
            {
                injectInto : 'topology',
                Navigation : one.topology.option.navigation(true,
                        'avoid nodes', 10),
                Node : one.topology.option.node(true, '#444', 25, 27),
                Edge : one.topology.option.edge(true, '23A4FF', 1.5),
                Tips : {
                    enable : true,
                    type : 'auto',
                    offsetX: 15,
                    offsetY: 15,
                    onShow : function(tip, node) {
                        if (node.name != undefined)
                            tip.innerHTML = "Name : " + node.name + "<br>";
                        if(node.data["$type"]!=undefined)
                            tip.innerHTML = tip.innerHTML + "Type : " + node.data["$type"] + "<br>";
                        if(node.data["$desc"]!=undefined)
                            tip.innerHTML = tip.innerHTML + "Description : " + node.data["$desc"];
                    }
                },
                Events : {
                    enable : true,
                    type : 'Native',
                    onMouseEnter : function(node, eventInfo, e) {
                        // if node
                        if (node.id != undefined) {
                            one.topology.graph.canvas.getElement().style.cursor = 'move';
                        } else if (eventInfo.edge != undefined
                                && eventInfo.edge.nodeTo.data["$type"] == "switch"
                                && eventInfo.edge.nodeFrom.data["$type"] == "switch") {
                            one.topology.graph.canvas.getElement().style.cursor = 'pointer';
                        }
                    },
                    onMouseLeave : function(node, eventInfo, e) {
                        one.topology.graph.canvas.getElement().style.cursor = '';
                    },
                    // Update node positions when dragged
                    onDragMove : function(node, eventInfo, e) {
                        var pos = eventInfo.getPos();
                        node.pos.setc(pos.x, pos.y);
                        one.topology.graph.plot();
                        one.topology.graph.canvas.getElement().style.cursor = 'crosshair';
                    },
                    // Implement the same handler for touchscreens
                    onTouchMove : function(node, eventInfo, e) {
                        $jit.util.event.stop(e); // stop default touchmove
                        // event
                        this.onDragMove(node, eventInfo, e);
                    },
                    onDragEnd : function(node, eventInfo, e) {
                        var ps = eventInfo.getPos();
                        var did = node.id;
                        var data = {};
                        data['x'] = ps.x;
                        data['y'] = ps.y;
                        $.post(one.global.remoteAddress + 'controller/web/topology/node/' + did, data);
                    },
                    onClick : function(node, eventInfo, e) {
                        if (one.topology === undefined) {
                            return false;
                        } else {
                            one.topology.Events.onClick(node, eventInfo);
                        }
                    }
                },
                iterations : 200,
                levelDistance : 130,
                onCreateLabel : function(domElement, node) {
                    var nameContainer = document.createElement('span'), closeButton = document
                            .createElement('span'), style = nameContainer.style;
                    nameContainer.className = 'name';
                    var nodeDesc = node.data["$desc"];
                    if (nodeDesc == "None" || nodeDesc == ""
                            || nodeDesc == "undefined" || nodeDesc == undefined) {
                        nameContainer.innerHTML = "<small>" + node.name
                                + "</small>";
                    } else {
                        nameContainer.innerHTML = nodeDesc;
                    }
                    domElement.appendChild(nameContainer);
                    style.fontSize = "1.0em";
                    style.color = "#000";
                    style.fontWeight = "bold";
                    style.width = "100%";
                    style.padding = "1.5px 4px";
                    style.display = "block";

                    one.topology.option.label(style, node);
                },
                onPlaceLabel : function(domElement, node) {
                    var style = domElement.style;
                    var left = parseInt(style.left);
                    var top = parseInt(style.top);
                    var w = domElement.offsetWidth;
                    style.left = (left - w / 2) + 'px';
                    style.top = (top - 15) + 'px';
                    style.display = '';
                    style.minWidth = "28px";
                    style.width = "auto";
                    style.height = "28px";
                    style.textAlign = "center";
                }
            });

    one.topology.graph.loadJSON(json);
    // compute positions incrementally and animate.
    one.topology.graph.computeIncremental({
        iter : 40,
        property : 'end',
        onStep : function(perc) {
            console.log(perc + '% loaded');
        },
        onComplete : function() {
            for ( var idx in one.topology.graph.graph.nodes) {
                var node = one.topology.graph.graph.nodes[idx];
                if (node.getData("x") && node.getData("y")) {
                    var x = node.getData("x");
                    var y = node.getData("y");
                    node.setPos(new $jit.Complex(x, y), "end");
                }
            }
            console.log('done');
            one.topology.graph.animate({
                modes : [ 'linear' ],
                transition : $jit.Trans.Elastic.easeOut,
                duration : 0
            });
        }
    });
    one.topology.graph.canvas.setZoom(0.8, 0.8);
}

one.topology.update = function() {
    alert("update");
    $('#topology').empty();
    $.getJSON(one.global.remoteAddress + "controller/web/topology/visual.json",
            function(data) {
                one.topology.init(data);
            });
}

/** INIT */
            alert("insert");
            one.topology.init([{"id":"OF|00:00:00:00:00:00:00:01","name":"OF|00:00:00:00:00:00:00:01","data":{"$x":"300","$y":"300","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:01"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:01","nodeFrom":"OF|00:00:00:00:00:00:00:05","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:05","$descFrom":"OF|00:00:00:00:00:00:00:05","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"2","$nodeToPortName":"OF|2@OF|00:00:00:00:00:00:00:01","$color":"#C6C014","$nodeFromPortDescription":"s5-eth3","$descTo":"OF|00:00:00:00:00:00:00:01","$nodeToPortDescription":"s1-eth2","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:02","nodeFrom":"OF|00:00:00:00:00:00:00:01","data":{"$nodeFromPortName":"OF|1@OF|00:00:00:00:00:00:00:01","$descFrom":"OF|00:00:00:00:00:00:00:01","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:02","$color":"#C6C014","$nodeFromPortDescription":"s1-eth1","$descTo":"OF|00:00:00:00:00:00:00:02","$nodeToPortDescription":"s2-eth3","$nodeFromPort":"1"}},{"nodeTo":"OF|00:00:00:00:00:00:00:01","nodeFrom":"OF|00:00:00:00:00:00:00:02","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:02","$descFrom":"OF|00:00:00:00:00:00:00:02","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"1","$nodeToPortName":"OF|1@OF|00:00:00:00:00:00:00:01","$color":"#C6C014","$nodeFromPortDescription":"s2-eth3","$descTo":"OF|00:00:00:00:00:00:00:01","$nodeToPortDescription":"s1-eth1","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:05","nodeFrom":"OF|00:00:00:00:00:00:00:01","data":{"$nodeFromPortName":"OF|2@OF|00:00:00:00:00:00:00:01","$descFrom":"OF|00:00:00:00:00:00:00:01","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:05","$color":"#C6C014","$nodeFromPortDescription":"s1-eth2","$descTo":"OF|00:00:00:00:00:00:00:05","$nodeToPortDescription":"s5-eth3","$nodeFromPort":"2"}}]},{"id":"OF|00:00:00:00:00:00:00:02","name":"OF|00:00:00:00:00:00:00:02","data":{"$x":"-323.125","$y":"186.875","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:02"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:02","nodeFrom":"OF|00:00:00:00:00:00:00:03","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:03","$descFrom":"OF|00:00:00:00:00:00:00:03","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"1","$nodeToPortName":"OF|1@OF|00:00:00:00:00:00:00:02","$color":"#C6C014","$nodeFromPortDescription":"s3-eth3","$descTo":"OF|00:00:00:00:00:00:00:02","$nodeToPortDescription":"s2-eth1","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:02","nodeFrom":"OF|00:00:00:00:00:00:00:04","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:04","$descFrom":"OF|00:00:00:00:00:00:00:04","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"2","$nodeToPortName":"OF|2@OF|00:00:00:00:00:00:00:02","$color":"#C6C014","$nodeFromPortDescription":"s4-eth3","$descTo":"OF|00:00:00:00:00:00:00:02","$nodeToPortDescription":"s2-eth2","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:03","nodeFrom":"OF|00:00:00:00:00:00:00:02","data":{"$nodeFromPortName":"OF|1@OF|00:00:00:00:00:00:00:02","$descFrom":"OF|00:00:00:00:00:00:00:02","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:03","$color":"#C6C014","$nodeFromPortDescription":"s2-eth1","$descTo":"OF|00:00:00:00:00:00:00:03","$nodeToPortDescription":"s3-eth3","$nodeFromPort":"1"}},{"nodeTo":"OF|00:00:00:00:00:00:00:04","nodeFrom":"OF|00:00:00:00:00:00:00:02","data":{"$nodeFromPortName":"OF|2@OF|00:00:00:00:00:00:00:02","$descFrom":"OF|00:00:00:00:00:00:00:02","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:04","$color":"#C6C014","$nodeFromPortDescription":"s2-eth2","$descTo":"OF|00:00:00:00:00:00:00:04","$nodeToPortDescription":"s4-eth3","$nodeFromPort":"2"}},{"nodeTo":"OF|00:00:00:00:00:00:00:02","nodeFrom":"OF|00:00:00:00:00:00:00:01","data":{"$nodeFromPortName":"OF|1@OF|00:00:00:00:00:00:00:01","$descFrom":"OF|00:00:00:00:00:00:00:01","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:02","$color":"#C6C014","$nodeFromPortDescription":"s1-eth1","$descTo":"OF|00:00:00:00:00:00:00:02","$nodeToPortDescription":"s2-eth3","$nodeFromPort":"1"}},{"nodeTo":"OF|00:00:00:00:00:00:00:01","nodeFrom":"OF|00:00:00:00:00:00:00:02","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:02","$descFrom":"OF|00:00:00:00:00:00:00:02","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"1","$nodeToPortName":"OF|1@OF|00:00:00:00:00:00:00:01","$color":"#C6C014","$nodeFromPortDescription":"s2-eth3","$descTo":"OF|00:00:00:00:00:00:00:01","$nodeToPortDescription":"s1-eth1","$nodeFromPort":"3"}}]},{"id":"OF|00:00:00:00:00:00:00:07","name":"OF|00:00:00:00:00:00:00:07","data":{"$x":"210.625","$y":"-278.125","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:07"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:05","nodeFrom":"OF|00:00:00:00:00:00:00:07","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:07","$descFrom":"OF|00:00:00:00:00:00:00:07","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"2","$nodeToPortName":"OF|2@OF|00:00:00:00:00:00:00:05","$color":"#C6C014","$nodeFromPortDescription":"s7-eth3","$descTo":"OF|00:00:00:00:00:00:00:05","$nodeToPortDescription":"s5-eth2","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:07","nodeFrom":"OF|00:00:00:00:00:00:00:05","data":{"$nodeFromPortName":"OF|2@OF|00:00:00:00:00:00:00:05","$descFrom":"OF|00:00:00:00:00:00:00:05","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:07","$color":"#C6C014","$nodeFromPortDescription":"s5-eth2","$descTo":"OF|00:00:00:00:00:00:00:07","$nodeToPortDescription":"s7-eth3","$nodeFromPort":"2"}}]},{"id":"OF|00:00:00:00:00:00:00:03","name":"OF|00:00:00:00:00:00:00:03","data":{"$x":"-440.625","$y":"-291.875","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:03"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:02","nodeFrom":"OF|00:00:00:00:00:00:00:03","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:03","$descFrom":"OF|00:00:00:00:00:00:00:03","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"1","$nodeToPortName":"OF|1@OF|00:00:00:00:00:00:00:02","$color":"#C6C014","$nodeFromPortDescription":"s3-eth3","$descTo":"OF|00:00:00:00:00:00:00:02","$nodeToPortDescription":"s2-eth1","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:03","nodeFrom":"OF|00:00:00:00:00:00:00:02","data":{"$nodeFromPortName":"OF|1@OF|00:00:00:00:00:00:00:02","$descFrom":"OF|00:00:00:00:00:00:00:02","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:03","$color":"#C6C014","$nodeFromPortDescription":"s2-eth1","$descTo":"OF|00:00:00:00:00:00:00:03","$nodeToPortDescription":"s3-eth3","$nodeFromPort":"1"}}]},{"id":"OF|00:00:00:00:00:00:00:04","name":"OF|00:00:00:00:00:00:00:04","data":{"$x":"-329.375","$y":"165.625","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:04"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:02","nodeFrom":"OF|00:00:00:00:00:00:00:04","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:04","$descFrom":"OF|00:00:00:00:00:00:00:04","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"2","$nodeToPortName":"OF|2@OF|00:00:00:00:00:00:00:02","$color":"#C6C014","$nodeFromPortDescription":"s4-eth3","$descTo":"OF|00:00:00:00:00:00:00:02","$nodeToPortDescription":"s2-eth2","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:04","nodeFrom":"OF|00:00:00:00:00:00:00:02","data":{"$nodeFromPortName":"OF|2@OF|00:00:00:00:00:00:00:02","$descFrom":"OF|00:00:00:00:00:00:00:02","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:04","$color":"#C6C014","$nodeFromPortDescription":"s2-eth2","$descTo":"OF|00:00:00:00:00:00:00:04","$nodeToPortDescription":"s4-eth3","$nodeFromPort":"2"}}]},{"id":"OF|00:00:00:00:00:00:00:05","name":"OF|00:00:00:00:00:00:00:05","data":{"$x":"-169.375","$y":"-214.375","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:05"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:06","nodeFrom":"OF|00:00:00:00:00:00:00:05","data":{"$nodeFromPortName":"OF|1@OF|00:00:00:00:00:00:00:05","$descFrom":"OF|00:00:00:00:00:00:00:05","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:06","$color":"#C6C014","$nodeFromPortDescription":"s5-eth1","$descTo":"OF|00:00:00:00:00:00:00:06","$nodeToPortDescription":"s6-eth3","$nodeFromPort":"1"}},{"nodeTo":"OF|00:00:00:00:00:00:00:05","nodeFrom":"OF|00:00:00:00:00:00:00:07","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:07","$descFrom":"OF|00:00:00:00:00:00:00:07","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"2","$nodeToPortName":"OF|2@OF|00:00:00:00:00:00:00:05","$color":"#C6C014","$nodeFromPortDescription":"s7-eth3","$descTo":"OF|00:00:00:00:00:00:00:05","$nodeToPortDescription":"s5-eth2","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:01","nodeFrom":"OF|00:00:00:00:00:00:00:05","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:05","$descFrom":"OF|00:00:00:00:00:00:00:05","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"2","$nodeToPortName":"OF|2@OF|00:00:00:00:00:00:00:01","$color":"#C6C014","$nodeFromPortDescription":"s5-eth3","$descTo":"OF|00:00:00:00:00:00:00:01","$nodeToPortDescription":"s1-eth2","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:05","nodeFrom":"OF|00:00:00:00:00:00:00:06","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:06","$descFrom":"OF|00:00:00:00:00:00:00:06","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"1","$nodeToPortName":"OF|1@OF|00:00:00:00:00:00:00:05","$color":"#C6C014","$nodeFromPortDescription":"s6-eth3","$descTo":"OF|00:00:00:00:00:00:00:05","$nodeToPortDescription":"s5-eth1","$nodeFromPort":"3"}},{"nodeTo":"OF|00:00:00:00:00:00:00:07","nodeFrom":"OF|00:00:00:00:00:00:00:05","data":{"$nodeFromPortName":"OF|2@OF|00:00:00:00:00:00:00:05","$descFrom":"OF|00:00:00:00:00:00:00:05","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:07","$color":"#C6C014","$nodeFromPortDescription":"s5-eth2","$descTo":"OF|00:00:00:00:00:00:00:07","$nodeToPortDescription":"s7-eth3","$nodeFromPort":"2"}},{"nodeTo":"OF|00:00:00:00:00:00:00:05","nodeFrom":"OF|00:00:00:00:00:00:00:01","data":{"$nodeFromPortName":"OF|2@OF|00:00:00:00:00:00:00:01","$descFrom":"OF|00:00:00:00:00:00:00:01","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:05","$color":"#C6C014","$nodeFromPortDescription":"s1-eth2","$descTo":"OF|00:00:00:00:00:00:00:05","$nodeToPortDescription":"s5-eth3","$nodeFromPort":"2"}}]},{"id":"OF|00:00:00:00:00:00:00:06","name":"OF|00:00:00:00:00:00:00:06","data":{"$x":"147.98413655297236","$y":"-113.76540415005883","$type":"switch","$desc":"OF|00:00:00:00:00:00:00:06"},"adjacencies":[{"nodeTo":"OF|00:00:00:00:00:00:00:06","nodeFrom":"OF|00:00:00:00:00:00:00:05","data":{"$nodeFromPortName":"OF|1@OF|00:00:00:00:00:00:00:05","$descFrom":"OF|00:00:00:00:00:00:00:05","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"3","$nodeToPortName":"OF|3@OF|00:00:00:00:00:00:00:06","$color":"#C6C014","$nodeFromPortDescription":"s5-eth1","$descTo":"OF|00:00:00:00:00:00:00:06","$nodeToPortDescription":"s6-eth3","$nodeFromPort":"1"}},{"nodeTo":"OF|00:00:00:00:00:00:00:05","nodeFrom":"OF|00:00:00:00:00:00:00:06","data":{"$nodeFromPortName":"OF|3@OF|00:00:00:00:00:00:00:06","$descFrom":"OF|00:00:00:00:00:00:00:06","$bandwidth":"BandWidth[10Gbps]","$nodeToPort":"1","$nodeToPortName":"OF|1@OF|00:00:00:00:00:00:00:05","$color":"#C6C014","$nodeFromPortDescription":"s6-eth3","$descTo":"OF|00:00:00:00:00:00:00:05","$nodeToPortDescription":"s5-eth1","$nodeFromPort":"3"}}]}]);
        

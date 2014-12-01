$(function() {
    var container = $('#container'),
        createUserForm = $('#create_user_form'),
        createTableForm = $('#create_table_form'),
        alterTableChangeForm = $('#alter_table_change_form'),
        alterTableAddForm = $('#alter_table_add_form'),
        alterTableDropColumnForm = $('#alter_table_drop_column_form'),
        createTable = $('#create_table'),
        createUsers = createUserForm.find('[name="privileges"]'),
        createTableTable = $('#create_table_table tbody').sortable(),
        alterTableAddTable = $('#alter_table_add_table tbody'),
        alterTableChangeTable = $('#alter_table_change_table tbody'),
        template = '<pre id="content">${content}</pre>',
        row = '<tr><td>⬍ <input type="text" name="name"></td><td><select name="type"></select></td><td><input type="text" name="length"></td><td><input type="text" name="default"></td><td><select name="attributes"><option value="" selected="selected"></option><option value="BINARY">BINARY</option><option value="UNSIGNED">UNSIGNED</option><option value="UNSIGNED ZEROFILL">UNSIGNED ZEROFILL</option><option value="on update CURRENT_TIMESTAMP">on update CURRENT_TIMESTAMP</option></select></td><td><input type="checkbox" name="null"></td><td><select name="index"><option>---</option><option value="primary">PRIMARY</option><option value="unique">UNIQUE</option><option value="index">INDEX</option><option value="fulltext">FULLTEXT</option></select></td><td><input type="checkbox" name="auto_inrement" value=""></td></tr>';

    $('#tabs').tabs();
    $('button').button();

    // Load collation
    $.get('option-collation.html', {}, function(response) {
        $.tmpl(response).appendTo('#collation');
    });

    loadOption();

    // Check all privileges
    $('#create_user_privilege_all').on('click', function() {
        createUsers.prop('checked', $(this).prop('checked'));
    });

    alterTableDropColumnForm.validate({
        rules: {
            table: 'required',
            column: 'required'
        },
        submitHandler: function() {
            var script = '';

            script += "ALTER TABLE `" + alterTableDropColumnForm.find('[name="table"]').val() + "` DROP COLUMN `" + alterTableDropColumnForm.find('[name="column"]').val() + "`";

            display(script);
        }
    });

    alterTableAddForm.validate({
        rules: {
            table: 'required'
        },
        submitHandler: function() {
            var script = '',
                row = '';

            script += "ALTER TABLE `" + alterTableAddForm.find('[name="table"]').val() + "` ADD ";
            row = genSqlString(alterTableAddTable.find('tr:first'));
            script += " " + row;

            if (alterTableAddForm.find('[name="after"]').val() !== '') {
                script += " AFTER `" + alterTableAddForm.find('[name="after"]').val() + "`";
            }

            display(script);
        }
    });

    alterTableChangeForm.validate({
        rules: {
            table: 'required',
            old_name: 'required',
        },
        submitHandler: function() {
            var script = '',
                row = '';

            script += "ALTER TABLE `" + alterTableChangeForm.find('[name="table"]').val() + "`";
            script += " CHANGE `" + alterTableChangeForm.find('[name="old_name"]').val() + "`";
            row = genSqlString(alterTableChangeTable.find('tr:first'));
            script += " " + row;

            if (alterTableChangeForm.find('[name="after"]').val() !== '') {
                script += " AFTER `" + alterTableChangeForm.find('[name="after"]').val() + "`";
            }

            display(script);
        }
    });

    createUserForm.validate({
        rules: {
            host: 'required',
            password: 'required',
            username: 'required'
        },
        submitHandler: function() {
            var script = '';

            if (createUsers.size() === createUsers.filter(':checked').size()) {
                script += "GRANT ALL PRIVILEGES ON";
            } else {
                var privileges = [];

                $.each(createUsers.filter(':checked'), function(index, item) {
                    privileges.push($(item).val());
                });

                script += "GRANT " + privileges.join(',') + " ON";
            }

            if (createUserForm.find('[name="database"]').val() === '') {
                script += " *.*";
            } else {
                script += " `" + createUserForm.find('[name="database"]').val() + "`.*";
            }

            script += " TO '" + createUserForm.find('[name="username"]').val() + "'@'" + createUserForm.find('[name="host"]').val() + "'";
            script += " IDENTIFIED BY '" + createUserForm.find('[name="password"]').val() + "' WITH GRANT OPTION;";

            display(script);
        }
    });

    createTableForm.validate({
        rules: {
            charset: 'required',
            collation: 'required',
            table: 'required'
        },
        submitHandler: function() {
            var table = '',
                row,
                rows = [];

            table += "CREATE TABLE `" + createTable.find('[name="table"]').val() + "` (\r";

            createTableTable.find('tr').each(function() {
                row = genSqlString($(this));

                if (row !== '') {
                    rows.push(row);
                }
            });

            table += rows.join(",\r");
            table += "\r) ENGINE=" + createTable.find('[name="engine"]').val() + " CHARACTER SET ";
            table += createTable.find('[name="charset"]').val() + " COLLATE " + createTable.find('[name="collation"]').val() + ";";

            display(table);
        }
    });

    function genSqlString(item) {
        var row = '';

        if (item.find('[name="name"]').val() !== '') {
            // Name
            row += "`" + item.find('[name="name"]').val() + "`";

            // Type
            if (item.find('[name="length"]').val() === '') {
                row += " " + item.find('[name="type"]').val();
            } else {
                row += " " + item.find('[name="type"]').val() + "(" + item.find('[name="length"]').val() + ")";
            }

            // Default
            if (item.find('[name="default"]').val() !== '') {
                row += " DEFAULT '" + item.find('[name="default"]').val() + "'";
            }

            // Attributes
            if (item.find('[name="attributes"]').val() !== '') {
                row += " " + item.find('[name="attributes"]').val();
            }

            // Null
            if (item.find('[name="null"]').is(':checked') === true) {
                row += " NULL";
            } else {
                row += " NOT NULL";
            }

            // Auto increment
            if (item.find('[name="auto_inrement"]').is(':checked') === true) {
                row += " AUTO_INCREMENT";
            }

            // index
            if (item.find('[name="index"]').val() === 'primary') {
                row += " PRIMARY KEY";
            } else if (item.find('[name="index"]').val() !== '---') {
                row += ",\r" + item.find('[name="index"]').val().toUpperCase() + "(`" + item.find('[name="name"]').val() + "`)";
            }
        }

        return row;
    }

    // Add new row
    $('#btn_create_table_add_row').on('click', function() {
        $.tmpl(row).appendTo(createTableTable);
        loadOption('last');
    });

    // Generate result
    function display(content) {
        container.html('');
        $.tmpl(template, {content: content}).appendTo(container);
        $('#content').snippet('sql', {
            style: 'darkblue',
            showNum: false
        });
    }

    function loadOption(last) {
        // Get type
        $.get('option-type.html', function(response) {
            if (undefined === last) {
                $.tmpl(response).appendTo('[name="type"]');
            } else {
                $.tmpl(response).appendTo(createTableTable.find('[name="type"]:last'));
            }
        });
    }
});

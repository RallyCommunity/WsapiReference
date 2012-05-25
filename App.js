Ext.define('WsapiReference', {
        extend:'Rally.app.App',
        componentCls:'app',

        baseServerUrl:'',

        launch:function () {
            this.baseServerUrl =  new Rally.sdk.env.Environment().getServer().getUrl();
            this.add({
                xtype:'panel',
                cls: 'mainPanel',
                width:'100%',
                height:'100%',
//                title:'WSAPI Object Models',
                layout:'border',
                items:[
                    {
                        region:'north',
                        itemId:'northRegion',
                        height:45,
                        margins:'5 5 10 5',
                        layout:'hbox',
                        items:this._getNorthItems()
                    },
                    {
                        title:'Query',
                        region:'west',
                        itemId:'westRegion',
                        margins:'0 5 5 5',
                        width:260,
                        collapsible:true,
                        layout:'fit'
                    },
                    {
                        title:'Attributes',
                        region:'center',
                        itemId:'centerRegion',
                        layout:'fit',
                        margins:'0 5 5 5'
                    },
                    {
                        title:'Misc',
                        region:'east',
                        itemId:'eastRegion',
                        split: true,
                        width:250,
                        collapsible:true,
                        collapsed: true,
                        layout:'fit',
                        margins:'0 5 5 0'
                    }
                ]
            });
        },

        _getNorthItems:function () {
            return [
//                {
//                    xtype:'rallycombobox',
//                    fieldLabel:'Wsapi Version:',
//                    store: Ext.create('Ext.data.Store', {
//                        fields: ['version'],
//                        data : [
//                            {version:'Coming Soon!'}
//                        ]
//                    }),
//                    queryMode: 'local',
//                    displayField: 'version',
//                    valueField: 'version',
//                    value: 'Coming Soon!',
//                    style:{
//                        margin:'10px'
//                    }
//                },
                {
                    xtype:'rallycombobox',
                    fieldLabel:'Workspace:',
                    itemId:'workspaceCombobox',
                    storeConfig:{
                        model:'Workspace',
                        autoLoad:true,
                        fetch:['Name', 'ObjectID'],
                        sorters:[
                            { property:'Name' }
                        ],
                        context:{
                            project:null,
                            workspace:'null' // must be a string
                        },
                        limit:Infinity
                    },
                    style:{
                        margin:'10px'
                    },
                    listeners:{
                        afterrender:this._onWorkspaceComboboxChange,
                        change:this._onWorkspaceComboboxChange,
                        scope:this
                    }
                }
            ];
        },

        _onWorkspaceComboboxChange:function (combobox, newvalue, oldvalue) {
            if (this.objectCombobox) {
                this.objectModel = null;
                this.objectCombobox.destroy();
            }

            this._refresh();

            // TODO filter out any objects we don't want to display
            this.objectCombobox = this.down('#northRegion').add({
                xtype:'rallycombobox',
                fieldLabel:'Object Model:',
                itemId:'objectCombobox',
                value: ' ',
                storeConfig:{
                    autoLoad:true,
                    model:'TypeDefinition',
                    fetch:['DisplayName', 'ElementName', 'Name'],
                    sorters:[
                        {
                            property:'Name',
                            direction:'ASC'
                        }
                    ],
                    context:{
                        project:null,
                        workspace:Rally.util.Ref.getRelativeUri(combobox.getValue())
                    },
                    listeners: {
                        load:{
                            fn:function(store, data){
                                store.insert(new store.model, 0);
                            }
                        }
                    }
                },
                valueField:'Name',
                listeners:{
                    change:{
                        fn:this._onObjectComboboxChanged,
                        workspace:combobox,
                        scope:this
                    }
                },
                style:{
                    margin:'10px'
                }
            });
        },

        _onObjectComboboxChanged:function (combobox, newValue, oldValue, eOpts) {
            this.objectModel = newValue.length > 1 ? newValue : null;
            Ext.create('Rally.data.WsapiDataStore', {
                model:'TypeDefinition',
                autoLoad:true,
                filters:{
                    property:'Name',
                    operator:'=',
                    value:newValue
                },
                sorters:[
                    {
                        property:'Name',
                        direction:'ASC'
                    }
                ],
                listeners:{
                    load:this._onObjectModelDataLoaded,
                    scope:this
                },
                context:{
                    project:null,
                    workspace: Rally.util.Ref.getRelativeUri(this.down('#workspaceCombobox').getValue())
                }
            });
        },

        _refresh:function () {
            if (!this.objectModel && this.down('#westRegion').title !== 'Query') {
                this.down('#westRegion').setTitle('Query');
                this.down('#centerRegion').setTitle('Attributes');
                this.down('#eastRegion').setTitle('Misc');
            }

            this.down('#westRegion').removeAll();
            this.down('#centerRegion').removeAll();
            this.down('#eastRegion').removeAll();
        },

        _onObjectModelDataLoaded:function (store, data) {
            this._refresh();
            if(data.length > 0){
                this._setWestItems();
                this._setCenterItems(data);
                this._setEastItems(data);
            }
        },

        _setWestItems:function () {
            this.down('#westRegion').setTitle(this.objectModel + ' Query');
            this.down('#westRegion').add(
                    {
                        xtype:'container',
                        items:[
                            {
                                xtype:'container',
                                defaults:{
                                    labelWidth:100
                                },
                                items:[
                                    {
                                        xtype:'rallytextfield',
                                        fieldLabel:'Query String',
                                        itemId:'queryString'
                                    },
                                    {
                                        xtype:'rallytextfield',
                                        fieldLabel:'Order',
                                        itemId:'order' //TODO add Desc/Asc option
                                    },
                                    {
                                        xtype:'numberfield',
                                        fieldLabel:'Start Index',
                                        value:1,
                                        itemId:'startIndex',
                                        width:150,
                                        allowBlank:false
                                    },
                                    {
                                        xtype:'numberfield',
                                        fieldLabel:'Page Size',
                                        value:20,
                                        itemId:'pageSize',
                                        width:150,
                                        allowBlank:false
                                    },
                                    {
                                        xtype:'checkbox',
                                        fieldLabel:'Full objects',
                                        itemId:'fullObjects',
                                        value:true
                                    },
                                    {
                                        xtype:'checkbox',
                                        fieldLabel:'XSL stylesheet',
                                        itemId:'xslStylesheet',
                                        value:true
                                    },
                                    {
                                        xtype:'checkbox',
                                        fieldLabel:'JSON output',
                                        itemId:'jsonOutput',
                                        value:true
                                    },
                                    {
                                        xtype:'checkbox',
                                        fieldLabel:'Open new tab',
                                        itemId:'newTab',
                                        value:true
                                    }
                                ]
                            },
                            {
                                xtype:'container',
                                layout:{
                                    type:'hbox',
                                    pack:'center'
                                },
                                style:{
                                    paddingTop:'20px'
                                },
                                items:[
                                    {
                                        xtype:'rallybutton',
                                        text:'Query',
                                        handler:Ext.bind(this._onQueryButtonClick, this),
                                        style:{
                                            display:'inline-block',
                                            marginRight:'10px'
                                        }
                                    },
                                    {
                                        xtype:'container',
                                        html:'<a href="" onclick="return false;">Reset</a>',
                                        style:{
                                            display:'inline-block',
                                            paddingTop:'5px'
                                        },
                                        listeners:{
                                            afterrender:{
                                                fn:function (container, eOpts) {
                                                    Ext.fly(container.el.dom.firstChild).on('click', function(){
                                                        var westRegion = this.down('#westRegion');
                                                        westRegion.down('#queryString').setValue('');
                                                        westRegion.down('#order').setValue('');
                                                        westRegion.down('#pageSize').setValue(20);
                                                        westRegion.down('#startIndex').setValue(1);
                                                        westRegion.down('#fullObjects').reset();
                                                        westRegion.down('#xslStylesheet').reset();
                                                        westRegion.down('#jsonOutput').reset();
                                                        westRegion.down('#newTab').reset();
                                                        westRegion.down('#queryString').focus();
                                                    }, this);
                                                }
                                            },
                                            scope: this
                                        }
                                    }
                                ]
                            }

                        ],
                        style:{
                            padding:'10px'
                        }

                    });
        },

        _setCenterItems:function (data) {
            this.down('#centerRegion').setTitle(this.objectModel + ' Attributes');
            this.down('#centerRegion').add(
                    {
                        xtype:'treepanel',
                        itemId:'treepanel',
                        flex:1,
                        store:Ext.create('Ext.data.TreeStore', {
                            fields:['Name', 'Field', 'Value', 'Filter'],
                            root:{
                                expanded:true,
                                text:this.objectModel + ' Object Model',
                                children:this._buildRows(data)
                            }
                        }),
                        rootVisible:false,
                        listeners: {
                            afterrender: {
                                fn: function(tree, eOpts){
                                    tree.filterableRootNode = tree.getRootNode();
                                }
                            },
                            cellclick: {
                                fn: function (o, idx, column, e) {
                                    if (column == 2) {
                                        var objectModel = idx.getElementsByTagName('a')[0].id;
                                        if(objectModel){
                                            this.objectCombobox.setValue(objectModel);
                                        }
                                    }
                                },
                                scope: this
                            }
                        },
                        columns:[
                            {
                                xtype:'treecolumn',
                                header:"Attribute",
                                dataIndex:'Name',
                                width:200
                            },
                            {
                                xtype:'gridcolumn',
                                header:'Field',
                                dataIndex:'Field',
                                menuDisabled:true,
                                sortable:false,
                                width:200
                            },
                            {
                                xtype:'gridcolumn',
                                header:'Value',
                                dataIndex:'Value',
                                menuDisabled:true,
                                sortable:false,
                                flex:1
                            }
                        ],
                        dockedItems:[
                            {
                                xtype:'toolbar',
                                dock:'top',
                                layout:{
                                    pack:'end'
                                },
                                items:[
                                    {
                                        xtype:'checkbox',
                                        boxLabel:'Expand All',
                                        itemId:'expandCheckbox',
                                        style:{
                                            fontSize:'9px',
                                            lineHeight:'12px',
                                            marginRight:'5px'
                                        },
                                        handler:function (checkbox, checked) {
                                            if (checked) {
                                                this.up('#treepanel').expandAll();
                                            } else {
                                                this.up('#treepanel').collapseAll();
                                            }
                                        }
                                    },
                                    '-',
                                    {
                                        xtype:'rallytextfield',
                                        fieldLabel:'Filter',
                                        enableKeyEvents:true,
                                        listeners:{
                                            focus:{
                                                fn:function (view, record, item, index, even) {
                                                    this.setValue("");
                                                }
                                            },
                                            keyup:{
                                                fn:function (view, record, item, index, even) {
                                                    //TODO fix where filtering rows messes up attributes expand/collapse
                                                    this.up('#treepanel').setRootNode(this.up('#treepanel').filterableRootNode);

                                                    var removeArray = [];
                                                    var filterText = this.getValue();

                                                    this.up('#treepanel').getRootNode().cascadeBy(function () {
                                                        if (!(this.data.Filter.toLowerCase().indexOf(filterText.toLowerCase()) > -1)) {
                                                            removeArray.push(this);
                                                        }
                                                    });

                                                    Ext.Array.each(removeArray, function (row) {
                                                        row.remove();
                                                    });
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
            );
        },

        _setEastItems: function(data){
            this.down('#eastRegion').setTitle(this.objectModel + ' Misc');
            this.down('#eastRegion').add(
                    {
                        xtype: 'rallygrid',
                        store: Ext.create('Rally.data.custom.Store', {
                                data: this._getEastRegionData(data),
                                pageSize: 5
                            }),
                        showPagingToolbar: false,
                        columnCfgs: [
                            {
                                dataIndex: 'Field', width: 75
                            },
                            {
                               dataIndex: 'Value', flex: 1
                            }
                         ]
                    }
            );
        },

        _getEastRegionData: function(data){
            var miscData = [];

            if(data[0].data.Parent && data[0].data.Parent._refObjectName){
                miscData.push({Field: 'Parent', Value: data[0].data.Parent._refObjectName});
            }

            if(data[0].data.Note){
                miscData.push({Field: 'Note', Value: data[0].data.Note});
            }

//            miscData.push({Field: 'Usage', Value: 'Coming soon!'});
//            miscData.push({Field: 'Rest URLs', Value: 'Coming soon!'});
            return miscData;
        },

        _buildRows:function (data) {
            var ignoreAttributes = [
                'Creation Date',
                'Object ID',
                'Subscription',
                'Workspace',
                'Changesets',
                'Description',
                'Discussion',
                'Formatted ID',
                'Last Update Date',
                'Name',
                'Notes',
                'Owner',
                'Project',
                'Revision History',
                'Tags'
            ];
            var rows = [];
            Ext.each(data[0].data.Attributes, function (attr) {
                if (!Ext.Array.contains(ignoreAttributes, attr.Name)) {
                    Ext.each(attr, function (field) {
                        var children = [];

                        if (field.AllowedValues.length) {
                            var values = [];
                            Ext.each(field.AllowedValues, function (value) {
                                values.push(value.StringValue);
                            });
                            children.push({Field:'Allowed Values', Value:values.join(", "), leaf:true, Filter:field.Name});
                        }

                        children.push({Field:'Data Type', Value:field.AttributeType, leaf:true, Filter:field.Name});

                        if (field.MaxLength !== -1) {
                            children.push({Field:'Max Length', Value:field.MaxLength, leaf:true, Filter:field.Name});
                        }

                        children.push({Field:'Note', Value:field.Note, leaf:true});

                        if (field.AllowedValueType) {
                            children.push({Field:'Ownership Relationship', Value:field.Owned, leaf:true, Filter:field.Name});
                        }

                        if (field.AllowedQueryOperators.length) {
                            var operators = [];
                            Ext.each(field.AllowedQueryOperators, function (value) {
                                operators.push(value.OperatorName);
                            });
                            children.push({Field:'Query Expression Operators', Value:operators.join(", "), leaf:true, Filter:field.Name});
                        }

                        children.push({Field:'Read Only', Value:field.ReadOnly, leaf:true});

                        if (field.AllowedValueType) {
                            var row = {Field:'Relationship', Value:field.AllowedValueType._refObjectName, leaf:true, Filter:field.Name};

                            //TODO make sure it is a selectable object model from the comobobox
                            if (field.AttributeType === 'OBJECT' || field.AttributeType === 'COLLECTION') {
                                var elementName = field.AllowedValueType._refObjectName.replace(/\s/g, "");
                                row.Value = '<a href="" onclick="return false;" id="' + elementName + '">' +
                                        field.AllowedValueType._refObjectName + '</a>';
                            }

                            children.push(row);
                        }

                        children.push(
                                {Field:'Required', Value:field.Required, leaf:true, Filter:field.Name},
                                {Field:'Sortable', Value:field.Filterable, leaf:true, Filter:field.Name}
                        );

                        rows.push({Name:field.Name, children:children, Filter:field.Name});
                    }, this);
                }
            }, this);

            this.rows = rows;
            return rows;
        },

        _onQueryButtonClick:function (button) {
            var params = {};
            var extension = '.js?';
            params.pretty = true;
            params.start = this.down('#startIndex').getValue();
            params.pagesize = this.down('#pageSize').getValue();

            if (this.down('#queryString').getValue() !== '') {
                params.query = this.down('#queryString').getValue();
            }

            if (this.down('#order').getValue() !== '') {
                params.order = this.down('#order').getValue();
            }

            if (this.down('#fullObjects').getSubmitValue()) {
                params.fetch = true;
            }

            if (this.down('#xslStylesheet').getSubmitValue()) {
                extension = '?';
            }

            var url = this.baseServerUrl+'/slm/webservice/1.33/' + this.objectModel.toLowerCase().replace(/\s/g, "") + extension + Ext.Object.toQueryString(params);

            if (this.down('#xslStylesheet').getSubmitValue()) {
                url = url + '&stylesheet='+this.baseServerUrl+'/slm/doc/webservice/browser.xsl'
            }

            var workspace = this.down('#workspaceCombobox').getValue();
            url = url + '&workspace=' + workspace.slice(0, workspace.length - 3);

            if (this.down('#jsonOutput').getSubmitValue()) {
                url = this.baseServerUrl+'/slm/doc/webservice/jsonDisplay.jsp?uri=' + url;
            }

            console.log(url);
            if (this.down('#newTab').getSubmitValue()) { // results open in new tab
                window.open(url, '_newtab');
            } else { // results open in dialog
                Ext.create('Ext.window.Window', {
                    title:this.objectModel + ' Query Results',
                    height:400,
                    width:600,
                    layout:'fit',
                    html:'<iframe src="' + url + '" width="100%" height="100%" background="#fff" ></iframe>',
                    style:{
                        background:'#fff'
                    }
                }).show();
            }
        }
    });
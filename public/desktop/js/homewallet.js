/* 
 * @name: StoreWizard Homewallet clients application part
 * @author: volovikov
 * @date: 06-августа-2012
 * @version: 1.1 beta
 */

Store.Grid.Init = function() {
    Ext.ux.grid.GroupSummary.Calculations['totalCost'] = function(v, record, field){
        return v + (record.data.estimate * record.data.rate);
    };	
}
Store.Grid.Show = function() {
	var baseParams = {start:0, limit:50},
		that = this,		
		store = '',
		fields = [],
		columns = [];

	var IsSummaryTab = function() {
		var tab = Store.GetStore();
		return (tab == 'losses' || tab == 'profit') ? true : false;
	}
	var GetBaseParams = function() {
		return baseParams;
	}
	var GetFields = function() {
		if (fields.lengths > 1) {
			return fields;
		} else {
			var tmp = Store.GetFields();
			
			if (IsSummaryTab()) {
				for (var i in tmp) {
					var item = tmp[i];
					
					switch (item.dataIndex) {						
						case 'january':
						case 'february':
						case 'march':
						case 'april':
						case 'may':
						case 'june':
						case 'july':
						case 'august':
						case 'september':
						case 'october':
						case 'november':
						case 'december':
						case 'average':
							item.summaryType = 'sum';
							break;
							
						case 'subcategory':
							item.summaryType = 'count';
							item.summaryRenderer = function(v, params, data) {
								return ((v === 0 || v > 1) ? '(' + v +' Подкатегории)' : '(1 Подкатегория)');
							};
							break; 
							
						default:
							item.summaryType = 'max';
							break;
					}
				}
			}
			fields = tmp.slice();
			fields.splice(0, 0, new Ext.grid.RowNumberer());
			return fields;				
		}
	}
	var GetColumns = function() {
		if (columns.length > 1) {
			return columns;
		} else {
			Ext.each(GetFields(), function() {
				columns.push({
					name: this.dataIndex
				});
			});
			return columns;
		}
	}
	var GetStore = function() {
		var tab = Store.GetStore();
		
		if (store != '') {
			return store;
		}	
		if (IsSummaryTab()) {
			store = new Ext.data.GroupingStore({
				proxy: new Ext.data.HttpProxy({
					method: 'get',
                    url: '/api/sig/'+Store.GetSig()+'/store/'+Store.GetStore()+'?dc='+Store.Util.GetDateTimeStamp()					
				}),
				baseParams: GetBaseParams(),
				reader: new Ext.data.JsonReader({
					root: 'results',
					totalProperty: 'total',
					id: 'id'
				}, GetColumns()),
				groupField: 'category'
			});
		} else {
			store = new Ext.data.Store({
				proxy: new Ext.data.HttpProxy({
					method: 'get',
					url: '/api/sig/'+Store.GetSig()+'/store/'+Store.GetStore()+'?dc='+Store.Util.GetDateTimeStamp()					
				}),
				baseParams: GetBaseParams(),
				reader: new Ext.data.JsonReader({
					root: 'results',
					totalProperty: 'total',
					id: 'id'
				}, GetColumns())					
			});				
		}
		return store;
	}
	var GetView = function() {
        var view;
        
		if (IsSummaryTab()) {
			view = new Ext.grid.GroupingView({
				forceFit:true,
				showGroupName: false,
				enableNoGroups: false,
				enableGroupingMenu: false,
				hideGroupedColumn: true				
			});
		} else {
			view = new Ext.grid.GridView({
				forceFit: true
			});
		}
		return view;
	}	
	this.me = new Ext.grid.GridPanel({
		view: GetView(),
		plugins: new Ext.ux.grid.GroupSummary(),
		tbar: [{
			text: 'Добавить',
			iconCls: 'icon-add',
			handler: function() {
				Store.Grid.OnClickAdd();
			}
		},'-',{
			text: 'Удалить',
			iconCls: 'icon-delete',
			handler: function() {
				Store.Grid.OnClickDelete();
			}
		},'-',{
			text: 'Изменить',
			iconCls: 'icon-edit',
			handler: function() {
				Store.Grid.OnClickEdit();
			}
		},'->',
		new Ext.app.SearchField({
			width:240,
			store: GetStore(),
			id: 'search-type',
			paramName: 'q'
		})],
        stripeRows: true,
		border: false,
		store: GetStore(),
		columns: GetFields(),
		listeners: {
			rowdblclick: function(g, row, r) {
				Store.Grid.OnClickEdit();
			},
			beforerender: function(g) {
                Store.Grid.HideUnvisibleColumn(g);                
			}
		},
		bbar: new Ext.PagingToolbar({
			pageSize: 50,
			store: GetStore(),
			displayInfo: true,
			displayMsg: 'Показано {0} - {1} из {2}',
			emptyMsg: '',
            listeners: {
                beforechange: Store.Grid.OnClickBeforeChangePage
            }
		})
	});	
	return this.me;		
}


(function(){

	var db;
	var _root,app={

		init:function(){
			_root = this;
			_root.initializeInDB();
		},
		initializeInDB:function(){
			var request = indexedDB.open("inapp");

			request.onupgradeneeded = function() {
			  // The database did not previously exist, so create object stores and indexes.
			  db = request.result;
			  var store = db.createObjectStore("employees", {keyPath: "empid"});
			  var nameIndex = store.createIndex("by_name", "name", {unique: true});
			  var designationIndex = store.createIndex("by_designation", "designation");

			  // Populate with initial data.
			  store.put({name: "Amarnath Raja", designation: "CEO", empid: 1});
			  store.put({name: "Jeena", designation: "PM", empid: 2});
			  store.put({name: "Jayan", designation: "AVP", empid: 3});
			};

			request.onsuccess = function() {
				db = request.result;
				_root.listEmployee(_root.renderEmployee);
			};
		},
		searchEmployee:function(searchWord){
			if(searchWord=="" || searchWord==undefined){
				_root.listEmployee(_root.renderEmployee);
			}else{
				var tx = db.transaction("employees", "readonly");
				var store = tx.objectStore("employees");
				var index = store.index("by_name");

				var request = index.openCursor(IDBKeyRange.only(searchWord));
				var data = [];

				request.onsuccess = function(e) {
				  var cursor = e.target.result
				  if (cursor) {
				    // Called for each matching record.
				    data.push(cursor.value);
				    cursor.continue();
				  } else {
				    // No more matching records.
				    _root.renderEmployee(data);
				  }
				};
			}
			
		},
		populateEmployee:function(id,name,designation){
			var tx = db.transaction("employees", "readwrite");
			var store = tx.objectStore("employees");
			var request = store.put({empid: id, name: name, designation: designation});
			request.onerror = function() {
			  // The uniqueness constraint of the "by_name" index failed.
			  console.log(request.error);
			  alert(request.error.message)
			  // Could call request.preventDefault() to prevent the transaction from aborting.
			};
			tx.onabort = function() {
			  // Otherwise the transaction will automatically abort due the failed request.
			  console.log(tx.error);
			};
			request.onsuccess = function(){
				_root.listEmployee(_root.renderEmployee);
			}
		},
		listEmployee:function(callback){

			var tx = db.transaction("employees", "readonly");
			var store = tx.objectStore("employees");
			// Get everything in the store
		    var keyRange = IDBKeyRange.lowerBound(0);
		    var request = store.openCursor(keyRange);

		    // This fires once per row in the store. So, for simplicity,
		    // collect the data in an array (data), and pass it in the
		    // callback in one go.
		    var data = [];
		    request.onsuccess = function(e) {
		      var result = e.target.result;

		      // If there's data, add it to array
		      if (result) {
		        data.push(result.value);
		        result.continue();

		      // Reach the end of the data
		      } else {
		        callback(data);
		      }
		    };
		},
		renderEmployee:function(data){
			var html = "<table class='gridtable'>"
						+"<tr>"
						+"<th>Employee ID</th>"
						+"<th>Name</th>"
						+"<th>Designation</th>"
						+"<tr>";
			if(data.length==0){
				html= "No data found</table>";
			}else{
				for(key in data){
					if(data.hasOwnProperty(key)){
						var dataObj = data[key];
						html+="	<tr>"
								+"<td>"+dataObj.empid+"</td>"
								+"<td>"+dataObj.name+"</td>"
								+"<td>"+dataObj.designation+"</td>"
								+"</tr>";
					}
				}
				html+="</table>";
			}			
			$('#data').html(html);
		},
		clearEmpObjStore:function(){
			var tx = db.transaction("employees", "readwrite");
			var store = tx.objectStore("employees");
			store.clear();
			_root.listEmployee(_root.renderEmployee);
		}

	}

	window.addEventListener('DOMContentLoaded',app.init.bind(app));
	
	$(document).ready(function(){
		$('#add_employee').on('click',function(e){
			e.preventDefault();
			var valid = $('#frm_employee')[0].checkValidity();
			if(valid){
				var name = $('#name').val();
				var id = $('#id').val();
				var desg = $('#desg').val();
				app.populateEmployee(id,name,desg);
				$('#name,#id,#desg').val("");
			}else{
				alert("Please Fill Required Fields");
			}
			
		});

		$('#search').on('click',function(){
			var name = $('#byname').val();
			app.searchEmployee(name);
			//$('#byname').val("");
		});

		$('#clear_store').on('click',function(){
			app.clearEmpObjStore();
		});
		

	});

})();
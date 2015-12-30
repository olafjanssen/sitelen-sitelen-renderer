var idoc = app.activeDocument; // get active document  
var ilayer = idoc.activeLayer; // get active layer  
  
for (i=ilayer.groupItems.length-1; i>=0; i--) // loop thru all groups backwards  
     {  
          var igroup = ilayer.groupItems[i]; // get group  
          var newLayer = idoc.layers.add(); // add new layer  
          newLayer.name = igroup.name; // rename layer same as group  
          igroup.move(newLayer,ElementPlacement.PLACEATEND); // move group to new layer  
     } 
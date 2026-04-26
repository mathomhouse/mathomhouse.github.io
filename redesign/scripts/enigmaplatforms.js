function showTable(){
    var enigmaComponent = document.getElementById("enigmaComponent");
    var enigmaFormation = document.getElementById("enigmaFormation");
    var enigmaEquipment = document.getElementById("enigmaEquipment");

    const dropdown = document.getElementById('enigmaSelect');
    const selectedValue = dropdown.options[dropdown.selectedIndex].value; 
    if(selectedValue === enigmaComponent.id){
        enigmaComponent.hidden = false;
        enigmaFormation.hidden = true;
        enigmaEquipment.hidden = true;
    }
    else if(selectedValue === enigmaFormation.id){
        enigmaComponent.hidden = true;
        enigmaFormation.hidden = false;
        enigmaEquipment.hidden = true;
    }
    else if(selectedValue === enigmaEquipment.id){
        enigmaComponent.hidden = true;
        enigmaFormation.hidden = true;
        enigmaEquipment.hidden = false;
    }
    else{
        //empty string
        enigmaComponent.hidden = true;
        enigmaFormation.hidden = true;
        enigmaEquipment.hidden = true;
    }
}
function showTable(){
    var skillsCombat = document.getElementById("skillsCombat");
    var skillsNonCombat = document.getElementById("skillsNonCombat");
    var skillsGathering = document.getElementById("skillsGathering");

    const dropdown = document.getElementById('skillsSelect');
    const selectedValue = dropdown.options[dropdown.selectedIndex].value; 
    if(selectedValue === skillsCombat.id){
        skillsCombat.hidden = false;
        skillsNonCombat.hidden = true;
        skillsGathering.hidden = true;
    }
    else if(selectedValue === skillsNonCombat.id){
        skillsCombat.hidden = true;
        skillsNonCombat.hidden = false;
        skillsGathering.hidden = true;
    }
    else if(selectedValue === skillsGathering.id){
        skillsCombat.hidden = true;
        skillsNonCombat.hidden = true;
        skillsGathering.hidden = false;
    }
    else{
        //empty string
        skillsCombat.hidden = true;
        skillsNonCombat.hidden = true;
        skillsGathering.hidden = true;
    }
}
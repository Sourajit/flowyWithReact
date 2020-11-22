document.addEventListener("DOMContentLoaded", function(){
    flowy(document.getElementById("canvas"), drag, release, snapping);
    function snapping(drag, first) {
        debugger;
        return true;
    }
    function drag(block) {
        debugger;
    }
    function release() {
        debugger;
    }
    
    document.getElementById("removeblock").addEventListener("click", function(){
        flowy.deleteBlocks();
    });
});
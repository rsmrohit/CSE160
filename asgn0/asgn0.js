function main() {
    // Retrieve canvas element and its context
    var canvas = document.getElementById("example");
    //err handling
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }
    var ctx = canvas.getContext("2d");

    // draw rect
    ctx.fillStyle = "blue";
    ctx.fillRect(50, 50, 150, 100);
    
    ctx.fillRect(100, 100, 30, 200);
}
// function renderAsPng(element) {
//     var svg = element;
//     var svgData = new XMLSerializer().serializeToString(svg);
//     svgData = svgData.replace('path{stroke-width:2;', 'path{stroke-width:4;');
//
//     var canvas = document.createElement("canvas");
//     var svgSize = svg.getBoundingClientRect();
//     canvas.width = 2 * svgSize.width;
//     canvas.height = 2 * svgSize.height;
//     var ctx = canvas.getContext("2d");
//
//     var canvas_out = document.createElement("canvas");
//     canvas_out.width = 2 * svgSize.width;
//     canvas_out.height = 2 * svgSize.height;
//     var ctx_out = canvas_out.getContext("2d");
//
//     // var brush = document.createElement("img");
//     // brush.setAttribute("src", "brush.svg");
//
//     var img = document.createElement("img");
//     img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
//
//     element.parentNode.replaceChild(img, element);
//
//     // function rotateAndPaintImage(context, image, angleInRad, positionX, positionY, axisX, axisY, dx, dy) {
//     //     context.translate(positionX, positionY);
//     //     context.rotate(angleInRad);
//     //     context.drawImage(image, -axisX, -axisY, dx, dy);
//     //     context.rotate(-angleInRad);
//     //     context.translate(-positionX, -positionY);
//     // }
//     //
//     // img.onload = function () {
//     //     ctx.drawImage(img, 0, 0);
//
//     // ctx_out.globalAlpha = 0.25;
//     // var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     // for (var i = 0; i < pixels.data.length; i += 4) {
//     //         var x = Math.floor(Math.floor(i / 4) / canvas.width),
//     //             y = Math.floor(i / 4) - x * canvas.width;
//     //
//     //         x += Math.sin(y / 100) * 10;
//     //         y += Math.sin(x / 100) * 10;
//     //
//     //
//     //         var dc = Math.floor(Math.random()*100 - 50), ds = Math.random()*10;
//     //
//     //         if (pixels.data[i] > 150) {
//     //             ctx_out.fillStyle = "rgba(" + (pixels.data[i]+dc) + "," + (pixels.data[i + 1]+dc) + "," + (pixels.data[i + 2]+dc) + "," + pixels.data[i + 3] / 255 + ")";
//     //             ctx_out.fillRect(y-ds/2, x-ds/2, ds, ds);
//     //         }
//     //
//     //     }
//     //     ctx_out.globalAlpha = 1;
//     //
//     //     ctx_out.globalAlpha = 0.25;
//     //     var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     //     for (var i = 0; i < pixels.data.length; i += 4) {
//     //         var x = Math.floor(Math.floor(i / 4) / canvas.width),
//     //             y = Math.floor(i / 4) - x * canvas.width;
//     //
//     //         x += Math.sin(y / 100) * 10;
//     //         y += Math.sin(x / 100) * 10;
//     //
//     //         if (pixels.data[i] == 0 && pixels.data[i + 3] == 255) {
//     //             // ctx.drawImage(brush, y - 10, x - 10, 20, 20);
//     //             rotateAndPaintImage(ctx_out, brush, Math.random() * Math.PI / 2, y - 5, x - 2, 0, 0, 10, 4);
//     //         }
//     //     }
//     //     ctx_out.globalAlpha = 1;
//     //
//
//
//     // var outImg = document.createElement("img");
//     // outImg.setAttribute('data-sitelen-sentence', '');
//     // outImg.src = canvas.toDataURL('image/png');
//     // outImg.style.width = svgSize.width + 'px';
//     // outImg.style.height = svgSize.height + 'px';
//     // element.parentNode.replaceChild(outImg, element);
//     // };
// }
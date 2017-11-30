function make(what) {
  var el = document.createElement(what)
  return el;
}

// AFRAME.registerComponent("axes", {
//   init: function() {
//     var entity = this.el
//         _(3).times(axis => {
//           _(20).times(n =>{
//             var loc = n - 10
//             var point = make("asphere")
//             point.setAttribute("position", {
//               x: (axis = 0) ? loc : 0,
//               y: (axis = 1) ? loc : 0,
//               z: (axis = 2) ? loc : 0
//             })
//             point.setAttribute("material", {
//               color: "white"
//             })
//             point.setAttribute("light", {
//               color: "white",
//               intensity: 0.75
//             })
//             entity.appendChild(point)
//           })
//         })
//   }
// })

AFRAME.registerComponent("axes", {
  init: function() {
    var entity = this.el
    var colors = ["rgb(255,0,0)", "rgb(0,255,100)", "rgb(0,0,255)"]

    var group = document.createElement("a-entity")
    group.setAttribute("id", "axes")

    _(3).times(a => {
      var axis = a

      _(20).times(n =>{
        var pos = n - 10
        var loc = {
          x: (axis == 0) ? pos : 0,
          y: (axis == 1) ? pos : 0,
          z: (axis == 2) ? pos : 0
        }
        // console.log("axis:", axis, "loc:", loc)

        var point = make("a-sphere")
        point.setAttribute("radius", 0.05)
        point.setAttribute("position", loc)
        point.setAttribute("material", {
          color: colors[axis],
          transparent: true,
          opacity: 0.75
        })

        var label = make("a-text")
        label.setAttribute("value", pos)
        label.setAttribute("position", loc)
        label.setAttribute("color", colors[axis])

        group.appendChild(point)
        group.appendChild(label)
      })
    })

    entity.appendChild(group)
  }
})


AFRAME.registerComponent("add-images", {
  init: function() {
    var parent = document.querySelector("#embryo1")
    console.log(parent)

    _(18).times(function(n) {
      // console.log("/assets/droso_WT/Mem_02/t_1_z_"+ (n+1) +".png")

      var el = document.createElement("a-plane")
      el.setAttribute('material', {
        transparent: true, 
        opacity: 0.2,
        src: '/assets/droso_WT/Mem_02/t_1_z_'+ (n+1) +'.png',
        side: 'double'
      });
      el.setAttribute('position', {x: 0, y: 2, z: n/18*0.1});
      // el.setAttribute('src', )

      // console.log(el)
      // var thing = el.getObject3D('mesh')
      // console.log(thing)
      // thing.material.blending = "THREE.AdditiveBlending"

      parent.appendChild(el)
    })
  }
})

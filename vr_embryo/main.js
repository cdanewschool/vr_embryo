AFRAME.registerComponent("add-images", {
  init: function() {
    console.log("happening")
    var parent = document.querySelector("#mainscene")
    console.log(parent)

    _(18).times(function(n) {
      console.log("/assets/droso_WT/Mem_02/t_1_z_"+ (n+1) +".png")

      var el = document.createElement("a-image")
      el.setAttribute('material', {transparent: true, opacity: 0.5});
      el.setAttribute('position', {x: 1, y: 2, z: n/18/2*-5});
      el.setAttribute('src', '/assets/droso_WT/Mem_02/t_1_z_'+ n +'.png')


      parent.appendChild(el)
    })
  }
})


AFRAME.registerComponent("image_init", {
  schema: {
    num: {type: 'number', default: 0}
  },
  init: function() {
    var cmp = this.el
    cmp.setAttribute("src", "/assets/droso_WT/Mem_02/t_1_z_"+ (this.data.num) +".png")
    // cmp.setAttribute("position", {x: 1, y: 0, z: (this.data.num*.1)})
    // cmp.setAttribute("material", "opacity", 0.15)
    cmp.setAttribute("position", "1 0 " + (this.data.num*.1))
    cmp.setAttribute("material", "opacity", "0.15")

    console.log(cmp)

  },

  update: function() {

  }
})

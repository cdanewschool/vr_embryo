var app = app || {}

// data model for the embryo
app.embryo = {
  species: "drosophilia melanogaster", // name of the species
  locator: "dro-mel-fr-sl-2-450", // format: genus_species_type_lab_channels_frames
  slices: 18,
  steps: 24,
  time: 35280, // total seconds of recording
  frames: 450,
  framerate: 0, // will be useful if we want to display an image at a given time in seconds
  type: "fluorescence recording", // microscopy type
  origin: "Shvartsman Lab", // lab origin
  channels: {
    "membrane staining": [],
    "nuclear staining": []
  },
  init: function() {
    var cmp = this
    var imagesloaded = new Event('imagesloaded')
    // then after loading the images, call document.dispatchEvent('imagesloaded')

    cmp.framerate = cmp.frames/cmp.time

    _(cmp.frames).times(f => {
      _(cmp.channels).each((arr, key) => {
        var folder = key.replace(/\s/, '-')

        // iterate over each file
        // var path = "assets/"+ cmp.locator +"/"+ folder +"/"+ filename
      })
    })


  },
  getImage: function(channel, time) {
    // an example of building functionality into the embryo object
    return channels[channel][time]
  }
}

function make(what) {
  var el = document.createElement(what)
  return el;
}



AFRAME.registerComponent("axes", {
  schema: {
    points: {type: "number", default: 3},
    size: {type: "number", default: .025}
  },
  init: function() {
    var cmp = this
    var entity = cmp.el
    var colors = ["rgb(255,0,0)", "rgb(0,255,100)", "rgb(0,0,255)"]

    var group = document.createElement("a-entity")
    group.setAttribute("id", "axes")

    _(3).times(a => {
      var axis = a
      _(cmp.data.points).times(n =>{
        var pos = n - cmp.data.points/2
        var loc = {
          x: (axis == 0) ? pos : 0,
          y: (axis == 1) ? pos : 0,
          z: (axis == 2) ? pos : 0
        }
        // console.log("axis:", axis, "loc:", loc)

        var point = make("a-sphere")
        point.setAttribute("radius", cmp.data.size)
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

      var el = document.createElement("a-image")
      el.setAttribute('material', {transparent: true, opacity: 0.5});
      el.setAttribute('position', {x: 1, y: 2, z: n/18/2*-5});
      el.setAttribute('src', '/assets/droso_WT/Mem_02/t_1_z_'+ (n+1) +'.png')


      parent.appendChild(el)
    })
  }
})

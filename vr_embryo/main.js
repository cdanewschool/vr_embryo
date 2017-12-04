require('aframe');
var _ = require('lodash')

var app = app || {}

app.ctl = {
  zspacing: 0.2,
  initialposition: {x: 0, y: 0, z: -2}
}

app.coordinates = AFRAME.utils.coordinates;

// data model for the embryo
app.embryo = {
  species: "drosophilia melanogaster", // name of the species
  locator: "dro-mel-fr-sl-2-450", // format: genus_species_type_lab_channels_frames
  slices: 18,
  steps: 25,
  time: 35280, // total seconds of recording
  frames: 450,
  framerate: 0, // will be useful if we want to display an image at a given time in seconds
  type: "fluorescence recording", // microscopy type
  origin: "Shvartsman Lab", // lab origin
  channels: {
    // ideally these (and this whole object) would be generated server-side from the file hierarchy
    "membrane-staining": {
      path: "",
      images: []
    },
    "nuclear-staining": {
      path: "",
      images: []
    }
  },
  init: function() {
    var cmp = this
    var imagesloaded = new Event('imagesloaded')
    // then after loading the images, call document.dispatchEvent('imagesloaded')

    cmp.framerate = cmp.frames/cmp.time
    // calculate FPS of the acquisition

    // generate paths for all filenames in all channels:

    // for each channel:
    _(cmp.channels).each((ch, key) => {
      ch.path = "assets/datasets/" + cmp.locator + "/" + key
      // for every step
      _(cmp.steps).times(f => {
        // and for every slice
        _(cmp.slices).times(s => {
          // console.log("channel", key, "frame", f, "slice", s)

          // compose the filename
          // e.g. assets/datasets/dro-mel-fr-sl-2-450/membrane-staining/t_24_z_17.png

          var filename = "t_" + f + "_z_" + s + ".png"
          var path = ch.path + "/" + filename

          // and add it to this channel's "images" array
          ch.images.push(path)
        })
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

window.addEventListener("wheel", e => {
  var pl = document.querySelector("#doodle")
  console.log(e.deltaY)
  pl.setAttribute("polyline", {
    path: (e.deltaY/10) + " 0 -4, 0 1 -4, 1 0 -5, 0 2 -6"
  })

  var stack = document.querySelector("#embryo1")
  stack.setAttribute("embryo-stack", {
    accordion: e.deltaY/10
  })
})

AFRAME.registerComponent("polyline", {
  schema: {
    color: { default: "#fff" },
    path: {
      default: [
        {x: 0.5, y: 0, z: 0},
        {x: -0.5, y: 0, z: 0}
      ],
      // Deserialize path in the form of comma-separated vec3s: `0 0 0, 1 1 1, 2 0 3`.
      parse: function (value) {
        return value.split(',').map(app.coordinates.parse);
      },

      // Serialize array of vec3s in case someone does
      // setAttribute('line', 'path', [...]).
      stringify: function (data) {
        return data.map(app.coordinates.stringify).join(',');
      }
    }

  },
  update: function(old_data) {
    var mat = new THREE.LineBasicMaterial({
      color: this.data.color
    })
    var geom = new THREE.Geometry()
    this.data.path.forEach(vertex => {
      geom.vertices.push(
        new THREE.Vector3(vertex.x, vertex.y, vertex.z)
      )
    })

    this.el.setObject3D("mesh", new THREE.Line(geom, mat))
  },
  remove: function() {
    this.el.removeObject3D('mesh');
  }
})

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

AFRAME.registerComponent("embryo-stack", {

  // break this up into individual components, one per slice. then generate / remove them in loops

  schema: {
    accordion: {default: 0.2},
    skew: {default: 0}
  },
  init: function() {
    var cmp = this
    app.embryo.init()
    console.log("embryo", app.embryo)
    _(app.embryo.channels).each((ch, channelname) => {
      _(app.embryo.slices).times(function(n) {
        var ell = document.createElement("a-image")
        var txl = new THREE.TextureLoader()
        var geometry = new THREE.PlaneGeometry(5,5)
        var material = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
        txl.load(ch.images[n], (texture) => {
          material.map = texture
          var mesh = new THREE.Mesh(geometry, material);
          ell.setObject3D("mesh", mesh)
          ell.id = ch + _ + n
          cmp.el.appendChild(ell)
        })
      })
    })
  },
  update: function(old_data) {
    var cmp = this
    var parent = document.querySelector("#embryo1")

    // _(app.embryo.channels).each((ch, channelname) => {
    //   _(app.embryo.slices).times(function(n) {
    //     // iterate through slices, "n" is number of current slice
    //     // console.log("/assets/droso_WT/Mem_02/t_1_z_"+ (n) +".png")

    //     var el = document.createElement("a-image")
    //     el.setAttribute('material', {
    //       shader: "standard",
    //       side: "double",
    //       transparent: true,
    //       opacity: 0.2,
    //       src: ch.images[n]
    //     });
    //     el.setAttribute('position', {
    //       x: app.ctl.initialposition.x + cmp.data.skew,
    //       y: app.ctl.initialposition.y,
    //       z: n/app.embryo.slices * cmp.data.accordion + app.ctl.initialposition.z
    //     });

    //     parent.appendChild(el)
    //   })
    // })
  }
})

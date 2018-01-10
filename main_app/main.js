require('aframe');
require('super-hands')
var _ = require('lodash')

window.app = window.app || {}

app.ctl = {
  zspacing: 0.2,
  t: 0,
  initialposition: {x: 0, y: 0, z: -2}
}

app.coordinates = AFRAME.utils.coordinates;

function make(what) {
  var el = document.createElement(what)
  return el;
}

window.addEventListener("keydown", e => {
  // console.log(e.key)
  if (e.key === "[") (app.ctl.t > 0) ? app.ctl.t-- : app.ctl.t = 0
  if (e.key === "]") (app.ctl.t < app.embryo.steps-1) ? app.ctl.t++ : app.ctl.t = app.embryo.steps-1
  console.log("time", app.ctl.t)
  var stack = document.querySelector("#embryo1")
  stack.setAttribute("embryo-stack", {
    time: app.ctl.t
  })
})

window.addEventListener("wheel", e => {
  var stack = document.querySelector("#embryo1")
  var current = [stack.getAttribute("embryo-stack").accordion, stack.getAttribute("embryo-stack").skew]

  stack.setAttribute("embryo-stack", {
    accordion: current[0] += e.deltaY,
    skew: current[1] += e.deltaX
  })
})


Element.prototype.setAttributes = function(attrs) {
  for(var key in attrs) {
    this.setAttribute(key, attrs[key]);
  }
}

// data model for the embryo
app.embryo = {
  species: "drosophilia melanogaster", // name of the species
  locator: "dro-mel-fr-sl-2-450", // format: genus_species_type_lab_channels_frames
  slices: 18,
  steps: 25,
  recording_length: 35280, // total seconds of recording
  frames: 450,
  framerate: 0, // will be useful if we want to display an image at a given time in seconds
  type: "fluorescence recording", // microscopy type
  origin: "Shvartsman Lab", // lab origin
  channels: {
    // ideally these (and this whole object) would be generated server-side from the file hierarchy
    "membrane-staining": {
      time: [],
      path: "",
      images: [],
      color: "hsl(50, 100%, 20%)"
    },
    "nuclear-staining": {
      time: [],
      path: "",
      images: [],
      color: "hsl(180, 100%, 40%)"
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

        ch.time[f] = {
          step: f,
          images: [] // placeholder for this timestep's list of image slices
        }

        _(cmp.slices).times(s => {
          // console.log("channel", key, "frame", f, "slice", s)

          // compose the filename
          //      |---------------------- ch.path ---------------------||--filename-|
          // e.g. assets/datasets/dro-mel-fr-sl-2-450/membrane-staining/t_24_z_17.png

          var filename = "t_" + f + "_z_" + s + ".png"

          var path = ch.path + "/" + filename

          // and add it to this channel's "images" array, at the proper time step
          ch.time[f].images.push(path)
        })
      })
    })
  },
  getImage: function(channel, time) {
    // an example of building functionality into the embryo object
    return channels[channel][time]
  }
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

    var group = make("a-entity")
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

AFRAME.registerComponent("outline", {
  schema: {
    color: {default: "#fff"}
  },
  init: function() {
    var mesh = this.el.getObject3D("mesh")
    var egeo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
    var emat = new THREE.LineBasicMaterial( {
      color: this.data.color,
      transparent: true,
      opacity: 0.4,
      linewidth: 1
    });
    var wireframe = new THREE.LineSegments( egeo, emat );
    mesh.add( wireframe );
  }

})

AFRAME.registerComponent("imaging-slice", {
  schema: {
    imgpath: { default: "assets/datasets/dro-mel-fr-sl-2-450/membrane-staining/t_24_z_17.png" },
    color:   { default: "#fff" },
    time: {default: 0}
    // ,AM: {}
  },
  init: function() {
    var cmp = this

    this.textures = _(app.embryo.steps).times(t => {
      return new THREE.TextureLoader().load(cmp.data.imgpath.replace(/t_[0-9]+_/g, "t_" + t + "_"))
    })
    var geometry = new THREE.PlaneGeometry(1,1)
    var material = new THREE.MeshBasicMaterial({
      color: this.data.color,
      alphaMap: this.textures[this.data.time],
      //alphaMap: this.data.AM
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    var mesh = new THREE.Mesh(geometry, material);
    this.el.setObject3D("mesh", mesh)
  },

  update: function() {
    console.log(this.data.time)
    this.el.getObject3D("mesh").material.alphaMap = this.textures[this.data.time]
  }

})

AFRAME.registerComponent("embryo-stack", {

  // break this up into individual components, one per slice. then generate / remove them in loops

  schema: {
    accordion: {default: 0.2},
    accordionDelta: {default: 0},
    skew: {default: 0},
    time: {default: 0}
  },
  init: function() {
    var cmp = this
    app.embryo.init()
    console.log("embryo", app.embryo)

    _(app.embryo.channels).each((ch, channelname) => {
      _(app.embryo.slices).times(function(n) {

        var plane = make("a-plane")

        plane.setAttributes({
          "imaging-slice": {
            imgpath: ch.time[app.ctl.t].images[n],
            // imgpath: ch.images[n],
            color: ch.color
          },
          "outline": {
            color: ch.color
          },
          "hoverable": "",
          "clickable": "",
          "grabbable": "",
          "stretchable": "",
          "class": channelname
        })

        plane.id = channelname + "-" + n
        cmp.el.appendChild(plane)
      })
    })
  },
  update: function(old_data) {
    var cmp = this
    var parent = this.el
    var kids = cmp.el.querySelectorAll("*")

    // console.log("stack time", cmp.data.time)
    _(kids).each((ell, ix) => {


      ell.setAttribute('imaging-slice', {time: cmp.data.time})


      ratio = ix/app.embryo.slices
      // console.log(ix/app.embryo.slices * cmp.data.accordion + app.ctl.initialposition.z)
      ell.setAttribute('position', {
        x: app.ctl.initialposition.x + ratio * cmp.data.skew * 0.01,
        y: app.ctl.initialposition.y,
        z: app.ctl.initialposition.z + ratio * cmp.data.accordion * 0.01
      })
    })
  }
})

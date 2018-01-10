require('aframe');
require('super-hands')
var _ = require('lodash')

window.app = window.app || {}  // establish global app variable for state changes

app.ctl = {
  zspacing: 0.2, // unused
  t: 0, // time step
  initialposition: {x: 0, y: 0, z: -2} // for placing embryo stack initially
}

app.coordinates = AFRAME.utils.coordinates;

function make(what) {
  // utility function to create new elements
  var el = document.createElement(what)
  return el;
}

Element.prototype.setAttributes = function(attrs) {
  //utility function for setting multiple attributes simultaneously
  for(var key in attrs) {
    this.setAttribute(key, attrs[key]);
  }
}

// temporary key mapping for testing time step changes
window.addEventListener("keydown", e => {

  // increment / decrement time step (but keep it in the 0-steps range)
  if (e.key === "[") (app.ctl.t > 0) ? app.ctl.t-- : app.ctl.t = 0
  if (e.key === "]") (app.ctl.t < app.embryo.steps-1) ? app.ctl.t++ : app.ctl.t = app.embryo.steps-1
  console.log("time", app.ctl.t)

  var stack = document.querySelector("#embryo1") // get the embryo stack's parent a-entity
  stack.setAttribute("embryo-stack", { // target the embryo-stack component
    time: app.ctl.t // modify this component's "time" datapoint in its schema
    // (this causes "update()" to happen)
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
      time: [], // empty array in which to store all the images
      path: "",  // to store the part of the url that corresponds to the channel
      color: "hsl(50, 100%, 20%)"
    },
    "nuclear-staining": {
      time: [],
      path: "",
      color: "hsl(180, 100%, 40%)"
    }
  },
  init: function() {
    var cmp = this
    var imagesloaded = new Event('imagesloaded')
    // then after loading the images, call document.dispatchEvent('imagesloaded')


    // generate paths for all filenames in all channels at every time step for each slice:

    // for each channel:
    _(cmp.channels).each((ch, key) => {
      ch.path = "assets/datasets/" + cmp.locator + "/" + key
      // for every step
      _(cmp.steps).times(f => {
        // and for every slice

        ch.time[f] = { // create this object to store the list of image url's
          step: f, // just in case we want an easier way to find this timestep in this channel later
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
  getImage: function(channel, timestep, slice) {
    // an example of building functionality into the embryo object
    return channels[channel].time[timestep].images[slice]
    // so if you wanted to "extract" a given image, you could do app.embryo.getImage("membrane-staining", 2, 4)
  }
}



AFRAME.registerComponent("axes", {
  // draws world axes in the 3d space
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
  // draw outline frame around embryo slice
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
  // this is the component for each individual "slice" - this is the entity whose texture changes
  // according to timestep, z position, and channel

  schema: {
    imgpath: { default: "assets/datasets/dro-mel-fr-sl-2-450/membrane-staining/t_24_z_17.png" },
    color:   { default: "#fff" }, // tint color, currently set by the channel
    slice_index: {default: 0}, // reference to which z position this is
    time: {default: 0} // used for determining which image url to select
  },
  init: function() {
    var cmp = this

    // fill up the array of textures:
    this.textures = _(app.embryo.steps).times(t => {
      // in here, "t" goes from 0 to the number of steps
      console.log("slice", cmp.data.slice_index, "loading timestep", t)

      // this regex is a clunky way of doing it -- could be done with simpler concatenation
      // or probably faster still, an array or json preloaded by the server so it doesn't have to be
      // generated on the fly:
      return new THREE.TextureLoader().load(cmp.data.imgpath.replace(/t_[0-9]+_/g, "t_" + t + "_"))
      // basically this looks for "t_**_" and replaces it with "t_0_" "t_1_" "t_2_" etc
    })

    var geometry = new THREE.PlaneGeometry(1,1) // all planes have the same geometry
    var material = new THREE.MeshBasicMaterial({ // most of the material properties stay the same too
      color: this.data.color, // choose the color based on the schema (i.e. the channel)
      alphaMap: this.textures[this.data.time], // choose which texture to use based on the schema (defaults to 0)
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    var mesh = new THREE.Mesh(geometry, material); // create mesh
    this.el.setObject3D("mesh", mesh) // assign it
  },

  update: function() {
    // console.log(this.data.time)

    // update this object's texture map -- the alphaMap -- to the proper texture given the new value of "time"
    this.el.getObject3D("mesh").material.alphaMap = this.textures[this.data.time]
  }

})

AFRAME.registerComponent("embryo-stack", {
  // component for the stack as a whole
  schema: {
    accordion: {default: 0.2}, // spread perpendicular to the planes
    accordionDelta: {default: 0},
    skew: {default: 0}, // spread parallel to the planes
    time: {default: 0} // current timestep (passed through to slices)
  },

  init: function() {
    var cmp = this
    app.embryo.init() // initialize the data model
    console.log("embryo", app.embryo)

    _(app.embryo.channels).each((ch, channelname) => { // for each channel
      _(app.embryo.slices).times(function(n) { // loop through the slices

        // and create a plane for each slice
        var plane = make("a-plane")

        plane.setAttributes({
          "imaging-slice": { // assign and target the imaging-slice component of the plane
            imgpath: ch.time[app.ctl.t].images[n], // pick the right image for the slice at the current time
            // imgpath: ch.images[n],
            color: ch.color, // assign the color of this channel to all of its slices
            slice_index: n // give each slice a unique index
          },
          "outline": {
            color: ch.color // add an outline component, set its color to match the channel
          },
          "hoverable": "", // for super-hands, not implemented
          "clickable": "", // for super-hands, not implemented
          "grabbable": "", // for super-hands, not implemented
          "stretchable": "", // for super-hands, not implemented
          "class": channelname // set class of the element based on channel's name
          // (will make selecting it later easier)
        })

        // give each plane element a unique id, e.g. "nuclear-staining-4"
        plane.id = channelname + "-" + n
        cmp.el.appendChild(plane) // append the complete plane to the embryo-stack a-entity
      })
    })
  },

  update: function(old_data) {
    var cmp = this
    var parent = this.el
    var kids = cmp.el.querySelectorAll("*") // get all of the stack's slices

    _(kids).each((ell, ix) => {

      ell.setAttribute('imaging-slice', {time: cmp.data.time}) // pass time through to the slice

      ratio = ix/app.embryo.slices // how far through the stack this slice is

      ell.setAttribute('position', { // set position of this slice:
        x: app.ctl.initialposition.x + ratio * cmp.data.skew * 0.01,
        y: app.ctl.initialposition.y,
        z: app.ctl.initialposition.z + ratio * cmp.data.accordion * 0.01
      })
    })
  }
})

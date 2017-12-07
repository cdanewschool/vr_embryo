require('aframe');
var _ = require('lodash')

var app = app || {}

app.ctl = {
  zspacing: 0.2,
  initialposition: {x: 0, y: 0, z: -2}
}

app.coordinates = AFRAME.utils.coordinates;

function make(what) {
  var el = document.createElement(what)
  return el;
}

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
  time: 35280, // total seconds of recording
  frames: 450,
  framerate: 0, // will be useful if we want to display an image at a given time in seconds
  type: "fluorescence recording", // microscopy type
  origin: "Shvartsman Lab", // lab origin
  channels: {
    // ideally these (and this whole object) would be generated server-side from the file hierarchy
    "membrane-staining": {
      path: "",
      images: [],
      color: "hsl(50, 100%, 20%)"
    },
    "nuclear-staining": {
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


window.addEventListener("wheel", e => {


  var stack = document.querySelector("#embryo1")
  var current = [stack.getAttribute("embryo-stack").accordion, stack.getAttribute("embryo-stack").skew]

  stack.setAttribute("embryo-stack", {
    accordion: current[0] += e.deltaY,
    skew: current[1] += e.deltaX
  })
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
    color:   { default: "#fff" }
  },
  init: function() {
    var texture = new THREE.TextureLoader().load(this.data.imgpath)
    var geometry = new THREE.PlaneGeometry(1,1)
    var material = new THREE.MeshBasicMaterial({
      color: this.data.color,
      alphaMap: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    var mesh = new THREE.Mesh(geometry, material);
    this.el.setObject3D("mesh", mesh)
  }

})

AFRAME.registerComponent("embryo-stack", {

  // break this up into individual components, one per slice. then generate / remove them in loops

  schema: {
    accordion: {default: 0.2},
    accordionDelta: {default: 0},
    skew: {default: 0}
  },
  init: function() {
    var cmp = this
    app.embryo.init()
    console.log("embryo", app.embryo)

    _(app.embryo.channels).each((ch, channelname) => {
      _(app.embryo.slices).times(function(n) {
        console.log(ch.images[n])
        var plane = make("a-plane")

        plane.setAttributes({
          "imaging-slice": {
            imgpath: ch.images[n],
            color: ch.color
          },
          "outline": {
            color: ch.color
          },
          "class": channelname
        })

        // plane.setAttribute("imaging-slice", {
        //   imgpath: ch.images[n],
        //   color: ch.color
        // })
        // plane.setAttribute("outline", {
        //   color: ch.color
        // })
        // plane.setAttribute("class", channelname)
        plane.id = channelname + "-" + n
        cmp.el.appendChild(plane)

        // var ell = make("a-plane")
        // var txl = new THREE.TextureLoader()
        // var geometry = new THREE.PlaneGeometry(5,5)
        // var material = new THREE.MeshBasicMaterial({
        //   transparent: true,
        //   opacity: 0.2
        // })

        // // txl.load("assets/datasets/dro-mel-fr-sl-2-450/membrane-staining/t_0_z_0.png", function() {})

        // txl.load(ch.images[n], (texture) => {
        //   var material = new THREE.MeshBasicMaterial({
        //     map: texture,
        //     side: THREE.DoubleSide,
        //     transparent: true,
        //     opacity: 0.2,
        //     depthWrite: false,
        //     blending: THREE.AdditiveBlending
        //   })
        //   // console.log(ch.images[n])

        //   var mesh = new THREE.Mesh(geometry, material);
        //   ell.setObject3D("mesh", mesh)
        //   ell.id = channelname + _ + n
        //   cmp.el.appendChild(ell)
        // })

      })
    })
  },
  update: function(old_data) {
    var cmp = this
    var parent = this.el
    var kids = cmp.el.querySelectorAll("*")
    _(kids).each((ell, ix) => {
      ratio = ix/app.embryo.slices
      // console.log(ix/app.embryo.slices * cmp.data.accordion + app.ctl.initialposition.z)
      ell.setAttribute('position', {
        x: app.ctl.initialposition.x + ratio * cmp.data.skew * 0.01,
        y: app.ctl.initialposition.y,
        z: app.ctl.initialposition.z + ratio * cmp.data.accordion * 0.01
      })
    })

    // el.children.forEach(function(ell) {
      // ell.setAttribute("position", {
              // x: app.ctl.initialposition.x + cmp.data.skew,
              // y: app.ctl.initialposition.y,
              // z: n/app.embryo.slices * cmp.data.accordion + app.ctl.initialposition.z
      // })
    // })

    // _(app.embryo.channels).each((ch, channelname) => {
      // _(app.embryo.slices).times(function(n) {
        // iterate through slices, "n" is number of current slice
        // console.log("/assets/droso_WT/Mem_02/t_1_z_"+ (n) +".png")

        // var el = document
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

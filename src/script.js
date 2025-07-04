import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import {Fn, vec4} from "three/tsl"
import {Lethargy} from "lethargy"
import { WheelGesture } from "@use-gesture/vanilla"

import red from '../static/red.png'
import green from '../static/green.png'
import gray from '../static/gray.png'

import bg from '../static/red-bg.jpg'
import bg1 from '../static/green-bg.jpg'
import bg2 from '../static/gray-bg.jpg'


export default class Sketch {
  constructor(options) {
    // this.scene = this.createScene();
    this.current = 0;
    this.scenes = [
      {
        bg: bg,
        matcap: red,
        geometry: new THREE.BoxGeometry(0.1, 0.1, 0.1)
      },
      {
        bg: bg1,
        matcap: green,
        geometry: new THREE.BoxGeometry(0.1, 0.1, 0.1)
      },
      {
        bg: bg2,
        matcap: gray,
        geometry: new THREE.BoxGeometry(0.1, 0.1, 0.1)
      }
    ]

    this.container = options.dom

    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0xeeeeee, 1)
    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.01, 1000)
    this.camera.position.set(0, 0, 2)

    this.scenes.forEach((o, index) => {
      o.scene = this.createScene(o.bg, o.matcap, o.geometry)
      this.renderer.compile(o.scene, this.camera)
      o.target = new THREE.WebGLRenderTarget(this.width, this.height)
    })


    // this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.time = 0
    this.isPlaying = true

    const THREE_PATH = `https://unpkg.com/three@${THREE.REVISION}/build/three.module.js`
    this.dracoLoader = new DRACOLoader( new THREE.LoadingManager() ).setDecoderPath(`${THREE_PATH}/examples/jsm/libs/draco/gltf/`);
    this.glTFLoader = new GLTFLoader()
    this.glTFLoader.setDRACOLoader(this.dracoLoader)
    this.isPlaying = true;
    // this.addObjects()
    this.setUpSettings()
    this.initPost()
    this.setupResize()
    this.render()

    this.lethargy = new Lethargy()

    this.gesture = new WheelGesture(document.body, (state) => {
      // console.log('gesture', state)
      console.log(this.lethargy.check(state.event))
    })
  }

  initPost() {
    this.postScene = new THREE.Scene()
    let frustumSize = 1;
    let aspect = 1;
    this.postCamera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        progress: { value: 0 },
        uTexture1: { value: new THREE.TextureLoader().load(bg) },
        uTexture2: { value: new THREE.TextureLoader().load(bg1) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      wireframe: false
    })

    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry( 1, 1 ),
      this.material
    )

    this.postScene.add(this.quad)
  }

  setUpSettings() {
    this.settings = {
      progress: 0,
    }
    this.gui = new GUI()
    this.gui.add(this.settings, 'progress', 0, 1, 0.01).onChange((val) => {})
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }

  createScene(background, matcap, geometry) {
    let scene = new THREE.Scene()

    let bgTexture = new THREE.TextureLoader().load(background)
    scene.background = bgTexture;

    let material = new THREE.MeshMatcapMaterial({
      matcap: new THREE.TextureLoader().load(matcap),
    })
    // let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
    let mesh = new THREE.Mesh(geometry, material)

    for (let index = 0; index < 300; index++) {
      let random = new THREE.Vector3().randomDirection()
      let clone = mesh.clone()
      clone.position.copy(random)
      clone.rotation.x = Math.random()
      clone.rotation.y = Math.random()
      scene.add(clone)
    }

    return scene;
  }

  // addObjects() {
  //   this.material = new THREE.ShaderMaterial({
  //     side: THREE.DoubleSide,
  //     uniforms: {
  //       time: { value: 0 },
  //       resolution: { value: new THREE.Vector4(this.width, this.height, 1, 1) }
  //     },
  //     vertexShader: vertex,
  //     fragmentShader: fragment,
  //     wireframe: false
  //   })

  //   this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
  //   this.plane = new THREE.Mesh(this.geometry, this.material)
  //   // this.scene.add(this.plane)
  // }

  play() {
    if(!this.isPlaying) {
      this.isPlaying = true
      this.time = 0
      this.render()

    }
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(light1)

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5)
    light2.position.set(0.5, 0, 0.866) 
    this.scene.add(light2)
  }

  stop() {
    this.isPlaying = false
  }

  render() {
    if (!this.isPlaying) return
    this.time += 0.05
    this.renderer.setRenderTarget(this.scenes[this.current].target)
    this.renderer.render(this.scenes[this.current].scene, this.camera)
    this.next = (this.current + 1) % this.scenes.length

    this.renderer.setRenderTarget(this.scenes[this.current + 1].target)
    this.renderer.render(this.scenes[this.current + 1].scene, this.camera)

    this.renderer.setRenderTarget(null)

    this.material.uniforms.uTexture1.value = this.scenes[this.current].target.texture
    this.material.uniforms.uTexture2.value = this.scenes[this.next].target.texture

    this.material.uniforms.progress.value = this.settings.progress

    requestAnimationFrame(this.render.bind(this))
    // this.renderer.render(this.scenes[2].scene, this.camera)
    this.renderer.render(this.postScene, this.postCamera)
  }
}

new Sketch({
  dom: document.getElementById('container')
})

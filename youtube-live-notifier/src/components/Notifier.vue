<template>
  <div>
    <div style="position: relative;">
      <svg
        id="YouTube_Icon"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="30px"
        y="22px"
        viewBox="0 0 1024 721"
        enable-background="new 0 0 1024 721"
        xml:space="preserve"
        :class="{pulse: live}"
      >
        <path
          id="Triangle"
          fill="#FFFFFF"
          d="M407,493l276-143L407,206V493z"
        ></path>
        <path
          id="The_Sharpness"
          opacity="0.12"
          fill="#420000"
          enable-background="new    "
          d="M407,206l242,161.6l34-17.6L407,206z"
        ></path>
        <g id="Lozenge">
          <g>
            <linearGradient
              id="SVGID_1_"
              gradientUnits="userSpaceOnUse"
              x1="512.5"
              y1="719.7"
              x2="512.5"
              y2="1.2"
              gradientTransform="matrix(1 0 0 -1 0 721)"
            >
              <stop
                offset="0"
                :style="{ 'stop-color': live ? lightColor : '#DDDDDD' }"
              ></stop>
              <stop
                offset="1"
                :style="{ 'stop-color': live ? darkColor : '#BBBBBB' }"
              ></stop>
            </linearGradient>
            <path
              fill="url(#SVGID_1_)"
              d="M1013,156.3c0,0-10-70.4-40.6-101.4C933.6,14.2,890,14,870.1,11.6C727.1,1.3,512.7,1.3,512.7,1.3    h-0.4c0,0-214.4,0-357.4,10.3C135,14,91.4,14.2,52.6,54.9C22,85.9,12,156.3,12,156.3S1.8,238.9,1.8,321.6v77.5    C1.8,481.8,12,564.4,12,564.4s10,70.4,40.6,101.4c38.9,40.7,89.9,39.4,112.6,43.7c81.7,7.8,347.3,10.3,347.3,10.3    s214.6-0.3,357.6-10.7c20-2.4,63.5-2.6,102.3-43.3c30.6-31,40.6-101.4,40.6-101.4s10.2-82.7,10.2-165.3v-77.5    C1023.2,238.9,1013,156.3,1013,156.3z M407,493V206l276,144L407,493z"
            ></path>
          </g>
        </g>
        <text
          v-show="live"
          x="0"
          y="721"
          dx="180"
          dy="-100"
          textLength="auto"
          lengthAdjust="spacing"
          style="font: bold 130px sans-serif; fill: #fff;"
        >We're Live!</text>
      </svg>
      <svg
        v-show="streamEnded"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="30px"
        y="22px"
        viewBox="0 0 1024 120"
        enable-background="new 0 0 1024 120"
        xml:space="preserve"
        class="stream-text"
      >
        <text
          x="0"
          y="120"
          dx="75"
          textLength="auto"
          lengthAdjust="spacing"
          style="font: bold 130px sans-serif; fill: #E52D27;"
        >Stream Ended</text>
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import io from 'socket.io-client'

@Component
export default class YTLiveNotifier extends Vue {
  @Prop() private channel!: string
  @Prop() private color!: string
  private live: boolean = false
  private streamEnded: boolean = false
  private liveFeeds: { [key: string]: string } = {}
  private darkColor: string
  private socket: any
  private channelSocket: any

  constructor() {
    super()
    this.darkColor = this.darken(this.lightColor)
  }

  get lightColor() {
    return this.color || '#E52D27'
  }

  beforeMount() {
    this.socket = io('http://localhost:7000')

    this.socket.on('connect', (message: string) => {
      this.requestChannel()
    })

    this.socket.on('disconnect', (reason: string) => {
      reason === 'io server disconnect' && this.socket.connect()
    })
  }

  updated() {
    this.darkColor = this.darken(this.lightColor)
  }

  beforeDestroy() {
    this.socket && this.socket.close()
    this.channelSocket && this.channelSocket.close()
  }

  requestChannel() {
    this.socket.emit(
      'channelRequest',
      this.channel,
      (data: { namespace: string; success: boolean }) => {
        this.channelSocket = io(`http://localhost:7000${data.namespace}`)

        this.channelSocket.on(
          'status',
          (data: { videoId: string; channelId: string }) => {
            if (this.live && !data.videoId) this.liveStreamFinished()

            this.live = !!data.videoId

            if (data.videoId && !this.liveFeeds[data.videoId]) {
              this.liveFeeds[data.videoId] = data.videoId
            } else if (!data.videoId) {
              this.liveFeeds = {}
            }
          }
        )
      }
    )
  }

  liveStreamFinished() {
    this.streamEnded = true
    setTimeout(() => {
      this.streamEnded = false
    }, 3000)
  }

  darken(color: string): string {
    const [hue, saturation, lightness] = color.startsWith('hsl')
      ? extractValues(color)
      : color.startsWith('rgb')
      ? transformRBGToHSL(extractValues(color))
      : color.charAt(0) === '#'
      ? transformRBGToHSL(getRBGValuesFromHex(color))
      : transformRBGToHSL(extractValues(getRGBStringFromColorName(color)))

    const newHue = hue - 4 < 0 ? 360 + (hue - 4) : hue - 4

    const newLightness = lightness - 12 < 0 ? 0 : lightness - 12

    return `hsl(${newHue}, ${saturation}%, ${newLightness}%)`

    function extractValues(color: string): number[] {
      return color
        .substring(color.indexOf('(') + 1)
        .split(' ')
        .join('')
        .split(',')
        .map(n => parseInt(n, 10))
    }

    function getRBGValuesFromHex(color: string): number[] {
      if (color.length === 7) {
        return [
          parseInt(color.substring(1, 3), 16),
          parseInt(color.substring(3, 5), 16),
          parseInt(color.substring(5), 16)
        ]
      } else if (color.length === 4) {
        return [
          parseInt(color.substring(1, 2), 16) * 16,
          parseInt(color.substring(2, 3), 16) * 16,
          parseInt(color.substring(3), 16) * 16
        ]
      } else {
        return [0, 0, 0]
      }
    }

    function getRGBStringFromColorName(color: string): string {
      const el = document.createElement('div')
      el.style.color = color
      const rgbString =
        window.getComputedStyle(document.body.appendChild(el)).color ||
        'rgb(0, 0, 0)'
      document.body.removeChild(el)
      return rgbString
    }

    function transformRBGToHSL(values: number[]): number[] {
      const [r, g, b] = values.map(v => v / 255)
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const l = (max + min) / 2
      let h = 0
      let s = 0

      if (max !== min) {
        const d = max - min

        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6
            break
          case g:
            h = ((b - r) / d + 2) / 6
            break
          case b:
            h = ((r - g) / d + 4) / 6
            break
        }
      }

      return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)]
    }
  }
}
</script>

<style>
.stream-text {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: translateY(420%);
  animation: fadeInOut 3s linear;
}

.pulse {
  animation: pulse 1s linear infinite;
}

@keyframes pulse {
  40% {
    transform: scale(1, 1);
  }
  55% {
    transform: scale(1.02, 1.02);
  }
  70% {
    transform: scale(1, 1);
  }
  85% {
    transform: scale(1.02, 1.02);
  }
  100% {
    transform: scale(1, 1);
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(420%);
  }
  15% {
    opacity: 1;
    transform: translateY(465%);
  }
  100% {
    opacity: 0;
    transform: translateY(720%);
  }
}
</style>

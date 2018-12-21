import Vue from 'vue'
import YTLiveNotifier from './Notifier.vue'

const Components: any = {
  YTLiveNotifier
}

Object.keys(Components).forEach(name => {
  Vue.component(name, Components[name])
})

export default Components

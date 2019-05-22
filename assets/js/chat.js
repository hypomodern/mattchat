// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from '@/app';
// import globalMixin from '@/mixins/global';

Vue.config.productionTip = false;

Vue.directive('autofocus', {
  inserted: el => el.focus(),
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<app/>',
});

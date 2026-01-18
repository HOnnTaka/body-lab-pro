<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/* 每个页面公共 CSS */

/* 全局滚动条样式（适用于 H5） */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: #3a86ff;
  border-radius: 4px;
}
/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #3a86ff rgba(255,255,255,0.05);
}
</style>

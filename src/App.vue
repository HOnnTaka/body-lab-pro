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
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.02);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb {
  background: #1e5abf;
  border-radius: 2px;
}
/* Firefox */
page {
  scrollbar-width: thin;
  scrollbar-color: #1e5abf rgba(255,255,255,0.02);
}
</style>

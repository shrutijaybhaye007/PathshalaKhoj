const { get } = require('./db/connection');
get('SELECT gallery_images FROM colleges WHERE id = 80')
  .then(res => console.log(res))
  .catch(err => console.error(err));

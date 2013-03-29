module.exports = {
  merge: function(){
  // last one wins
    return [].reduce.call(arguments, function(all, object){
      if (!object) return all;
      for(var prop in object){
        all[prop] = object[prop];
      }
      return all;
    }, {});  
}

}
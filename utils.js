module.exports = {
  format_mmddyyyy: function (str) {
    x = str.split('/')
    for(i = 0; i < 2; i ++){
	 	if(x[i].length < 2){
	    	x[i] = "0" + x[i]
	    }
    }
    newdate = x[0] + "/" + x[1] + "/" + x[2]
    console.log("formatted " + str + " to " + newdate)
    return newdate;
  }
};

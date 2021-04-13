var stream = require('stream');
var fs = require('fs');
 
const s3 = require('../config/s3.config.js');
 
exports.doDownload = (req, res,) => {
	console.log('downloading using s3 client');
	const s3Client = s3.s3Client;
	const params = s3.downloadParams;
	
	params.Key = req.params.filename;

	let filePath = '/home/aidan/nodeServer/content/'+params.Key;
	s3Client.getObject(params, function(err, data) {
		if(err){
			console.log('there was an error downloading the file');
			res.status(200).json({result: err}).send();
		}
		else{
			fs.writeFileSync(filePath, data.Body);
			console.log(params.Key+' downloaded');
			res.status(200).json({result: params.Key + ' downloaded succesfully', filePath: filePath}).send();
		}
	});
	
}

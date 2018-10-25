const express = require('express');
const app = express();
const Joi = require('joi');

var publicDir = require('path').join(__dirname,'/public');
app.use(express.static(publicDir));

var exRoutes = express.Router();

app.use(express.json());

var mysql = require('mysql');

var conInvoice = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "kiran",
	 database: "invoice"
  });


const port = process.env.PORT || 3000;
app.listen(port,()=> console.log(`Listening port ${port}`));



app.post('/invoice', (req, res) => {

	const user = {
		id: users.length + 1,
		name: req.body.name
	}
	let columns;
	let grouping;
	if(req.body.columns) {
		columns = req.body.columns.join(", ");
	}
	if(req.body.grouping) {
		grouping = req.body.grouping.join(", ");
	}
	 let record = [
	 	[req.body.invoiceLayout,
		req.body.isActiveInvoiceLayout,
		req.body.isDefaultInvoiceLayout,
		columns,
		grouping,
		req.body.id
		]
	 ];
	 console.log('body :: ', req.body);

	var sql = 'update invoices set invoiceLayout=?, isActiveInvoiceLayout=?, isDefaultInvoiceLayout=?, columns=?, grouping=?, logofilename=?, supresscompanylogo=? ,removelogo =? where id=?;';
	
	console.log(req.body.logoInfo+"::"+req.body.invoiceLayout+"::"+req.body.invoiceLayout+"SQL::"+sql);
	
  conInvoice.query(sql, [req.body.invoiceLayout,
	req.body.isActiveInvoiceLayout,
	req.body.isDefaultInvoiceLayout,
	columns,
	grouping,
	req.body.logoInfo.fileName,
	req.body.logoInfo.supressCompanyLogo,
	req.body.logoInfo.removeLogo,
	req.body.id], function (err, result) {

     if (err) {
     	console.log(err);
     	return res.send("ERROR");
     }else{
     	console.log("1 record updated");
     return res.send("SUCCESS");	
     }
   });
});


app.put('/invoice', (req, res) => {
	let columns;
	let grouping;
	let additionalInfo = [];
	let additionaldata;
	if(req.body.columns) {
		columns = req.body.columns.join(",");
	}
	if(req.body.grouping) {
		grouping = req.body.grouping.join(",");
	}
	if(req.body.additionalInfo) {
		for(var key in req.body.additionalInfo) {
			console.log('key :' , key , '::' , 'Value :' , req.body.additionalInfo[key]);
			additionalInfo.push(key+'*'+req.body.additionalInfo[key])
		}	
		additionaldata = additionalInfo.join('!');
	}

	var sql = 'update invoices set invoiceLayout=?, isActiveInvoiceLayout=?, isDefaultInvoiceLayout=?, columns=?, grouping=?, additionaldata=?, logofilename=?, supresscompanylogo=? ,removelogo =?,footerfilename = ? , removefooter=? where id=?;';
	
	console.log(req.body.id+"::"+req.body.invoiceLayout+"::"+req.body.invoiceLayout+"SQL::"+sql);
	
  conInvoice.query(sql, [req.body.general.invoiceLayout,
	req.body.general.isActiveInvoiceLayout,
	req.body.general.isDefaultInvoiceLayout,
	columns,
	grouping,
	additionaldata,
	req.body.logoInfo.fileName,
	req.body.logoInfo.supressCompanyLogo,
	req.body.logoInfo.removeLogo,
	req.body.footerInfo.fileName,
	req.body.footerInfo.removeFooter,
	req.body.id], function (err, result) {

     if (err) {
     	console.log(err);
     	return res.send({res: "ERROR"});
     }else{
     	console.log("1 record updated");
     return res.send({res: "SUCCESS"});	
     }
   });

});
app.get('/invoice', (req,res) => {
	let response;
		let query = "select * from invoices where id = 1111";
		let my = this;
		let general = {
			invoiceLayout: '',
			isDefaultInvoiceLayout: false,
			isActiveInvoiceLayout: false,
		};

		let additionalInfo = {
			additionalText : '',
			locationOfInvoiceText : '',
			isincludeBalances : false,
			isSupressTerms : false,
			isSupressFormAddress : false,
			isShowDueDateCalculatedFromTerms : false,
			isDisplayNegativeNumbersRedColor : false,
			isSupressCentsWhenPossible : false,
			isUseISOCurrencyCodes : false,
			isBreakdownTakes : false,
			isSuppressProjectName : false,
			formatHours : '',
			isAddAttachmentLinks : false,
			isIncludeAttachmentDownloadPDF : false,
			isSuppressTotalPaymentToDate : false,
		  };
		  logoInfo = {
			fileName: 'none' ,
			path: '',
			supressCompanyLogo: false,
			removeLogo: false
		  };

		  footerInfo = {
			fileName: 'none' ,
			path: '',
			removeFooter: false
		  };
		conInvoice.query( query , function(err, result){
			if(err) throw err;
			console.log(JSON.stringify(result));
			result.forEach((value) => {
				general.isDefaultInvoiceLayout = value.isDefaultInvoiceLayout === 1 ? true : false;
				general.isActiveInvoiceLayout = value.isActiveInvoiceLayout === 1 ? true : false;
				if(value.columns) {
					let divide = value.columns.split(',');
					console.log(divide); 
					value.columns = divide;
				}
				if(value.grouping) {
					let divide = value.grouping.split(',');
					console.log(divide); 
					value.grouping = divide;
				}

				if(value.additionaldata) {
					let divide = value.additionaldata.split('!');
					
					for(var key in divide) {
						let pairs = divide[key].split('*');
						console.log(pairs);
						var actualVal;
						if(pairs[1] === 'true') {
							actualVal = true;
						} else if(pairs[1] === 'false') {
							actualVal = false;
						} else {
							actualVal = pairs[1];
						}
						 additionalInfo[pairs[0]] = actualVal;
					}
					 console.log('AdditionalData', additionalInfo);
				}

				if(value.logofilename) {
					logoInfo.fileName = value.logofilename;
					logoInfo.path = 'http://localhost:3000/upload/';
				}
				logoInfo.supressCompanyLogo = value.supresscompanylogo === 1 ? true : false;
				logoInfo.removeLogo = value.removelogo === 1 ? true : false;

				if(value.footerfilename) {
					footerInfo.fileName = value.footerfilename;
					footerInfo.path = 'http://localhost:3000/upload/';
				}
				footerInfo.removeFooter = value.removefooter === 1 ? true : false;
			
				if(value.invoiceLayout) {
					general.invoiceLayout = value.invoiceLayout;
					delete value.invoiceLayout;
				}
				value.logoInfo = logoInfo;
				value.additionalInfo = additionalInfo;
				value.general = general;
				value.footerInfo = footerInfo;

				delete value.footerfilename;
				delete value.removefooter;
				delete value.logopath;
				delete value.logofilename;
				delete value.supresscompanylogo;
				delete value.removelogo;
				delete value.additionaldata;
				delete value.isDefaultInvoiceLayout;
				delete value.isActiveInvoiceLayout;
			});
			res.send(JSON.stringify(result));
	
		});
	});
	const fs = require("fs");
	
	var multer = require("multer");
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, './public/upload')
		},
		filename: function (req, file, cb) {
			cb(null, file.originalname)
		}
	})
	// const upload = multer({
	// 	storage: storage
	// })

	var upload = multer({
		storage: storage
	}).array("file", 3);
	app.post('/logo-image', (req, res) => {
		upload(req, res, function(err) {
			if (err) {
				res.send({'message': "Something went wrong!"});
			}
			console.log(req.body);
			// var sql = 'update invoices set invoiceLayout=?, isActiveInvoiceLayout=?, isDefaultInvoiceLayout=?, columns=?, grouping=? where id=?;';
			// conInvoice.query( query , function(err, result){

			// });	
			res.send({'message': 'Image uploaded'});
		});
		
	  });
	  
function validateUser(user){
	const schema = {
		name: Joi.string().min(3).max(10).required()
	}
	return Joi.validate(user, schema);
}


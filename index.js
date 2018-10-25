const express = require('express');
const app = express();
const Joi = require('joi');
const fs = require("fs");	
const multer = require("multer");

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
	let columns;
	let grouping;
	let additionalInfo = [];
    let additionaldata;
    let id;
    var query = "select count(*) as count from invoices";

    conInvoice.query(query, (err, result ) => {
        if(err) {
            res.send({response: "DB Issue con"});
        }
        if(result[0]) {
            id = parseInt(result[0].count) + 1;
            if(req.body.columns) {
                columns = req.body.columns.join(",");
            }
            if(req.body.grouping) {
                grouping = req.body.grouping.join(",");
            }
            if(req.body.additionalInfo) {
                for(var key in req.body.additionalInfo) {
                    // console.log('key :' , key , '::' , 'Value :' , req.body.additionalInfo[key]);
                    additionalInfo.push(key+'*'+req.body.additionalInfo[key])
                }	
                additionaldata = additionalInfo.join('!');
            }
        
            var sql = 'insert into invoices(invoiceLayout,isActiveInvoiceLayout,isDefaultInvoiceLayout,columns,grouping,additionaldata,logofilename,supresscompanylogo,removelogo,footerfilename,removefooter,id) values (?,?,?,?,?,?,?,?,?,?,?,?)';
            
            // console.log(req.body.id+"::"+req.body.invoiceLayout+"::"+req.body.invoiceLayout+"SQL::"+sql);
            
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
                    id], function (err, result) {
                                        if (err) {
                                            // console.log(err);
                                            return res.send({res: "ERROR"});
                                        }else{
                                            var queryInsert = "insert into invoicelist (invoiceid,invoicelayout) values (?,?)";
                                            conInvoice.query(queryInsert, [id, req.body.general.invoiceLayout] ,(err, result) => {
                                                if(err) {
                                                    return res.send({res: "ERROR"});
                                                }
                                                 // console.log("1 record updated");
                                                 return res.send({res: "SUCCESS"});
                                            });
                                                
                                        }
                    });
            
        }else {
            console.log(result[0].count);
            res.send({response: "DB Issue count"});
        }
    });
});


app.put('/invoice/:id', (req, res) => {
	let columns;
	let grouping;
	let additionalInfo = [];
    let additionaldata;
    let invoiceId = req.params['id'];
    if(invoiceId) {
        if(req.body.columns) {
            columns = req.body.columns.join(",");
        }
        if(req.body.grouping) {
            grouping = req.body.grouping.join(",");
        }
        if(req.body.additionalInfo) {
            for(var key in req.body.additionalInfo) {
                // console.log('key :' , key , '::' , 'Value :' , req.body.additionalInfo[key]);
                additionalInfo.push(key+'*'+req.body.additionalInfo[key])
            }	
            additionaldata = additionalInfo.join('!');
        }

        var sql = 'update invoices set invoiceLayout=?, isActiveInvoiceLayout=?, isDefaultInvoiceLayout=?, columns=?, grouping=?, additionaldata=?, logofilename=?, supresscompanylogo=? ,removelogo =?,footerfilename = ? , removefooter=? where id=?;';
        
        // console.log(req.body.id+"::"+req.body.invoiceLayout+"::"+req.body.invoiceLayout+"SQL::"+sql);
        
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
                parseInt(invoiceId)], function (err, result) {

                if (err) {
                    // console.log(err);
                    return res.send({res: "ERROR"});
                }else{
                    // console.log("1 record updated");
                return res.send({res: "SUCCESS"});	
                }
            });
    }else {
        res.send({response: "Invalid Requset"});
    }
        

});
app.get('/invoice/:id', (req,res) => {
    let invoiceId = req.params['id'];
    if(invoiceId) {
		let query = "select * from invoices where id =" +invoiceId;
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
			// console.log(JSON.stringify(result));
			result.forEach((value) => {
				general.isDefaultInvoiceLayout = value.isDefaultInvoiceLayout === 1 ? true : false;
				general.isActiveInvoiceLayout = value.isActiveInvoiceLayout === 1 ? true : false;
				if(value.columns) {
					let divide = value.columns.split(',');
					// console.log(divide); 
					value.columns = divide;
				}
				if(value.grouping) {
					let divide = value.grouping.split(',');
					// console.log(divide); 
					value.grouping = divide;
				}

				if(value.additionaldata) {
					let divide = value.additionaldata.split('!');
					
					for(var key in divide) {
						let pairs = divide[key].split('*');
						// console.log(pairs);
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
					 // console.log('AdditionalData', additionalInfo);
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
    } else {
        res.send({response: "Invalid Requset"});
    }

});
    
app.get('/invoice', (req,res) => {
		let query = "select * from invoices";
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
			if(err) res.send({response: "DB Issue"});
			// console.log(JSON.stringify(result));
			result.forEach((value) => {
				general.isDefaultInvoiceLayout = value.isDefaultInvoiceLayout === 1 ? true : false;
				general.isActiveInvoiceLayout = value.isActiveInvoiceLayout === 1 ? true : false;
				if(value.columns) {
					let divide = value.columns.split(',');
					// console.log(divide); 
					value.columns = divide;
				}
				if(value.grouping) {
					let divide = value.grouping.split(',');
					// console.log(divide); 
					value.grouping = divide;
				}

				if(value.additionaldata) {
					let divide = value.additionaldata.split('!');
					
					for(var key in divide) {
						let pairs = divide[key].split('*');
						// console.log(pairs);
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
					 // console.log('AdditionalData', additionalInfo);
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


app.get('/invoice-data', (req, res) => {
	let query = "select * from invoicelist";
	conInvoice.query(query, (err, result) => {
		if(err) res.send({response: "DB Issue"});
		res.send(JSON.stringify(result));
	});
});

app.delete('/invoice/:id', (req, res) => {
	let invoiceId = req.params['id'];
	let query = "delete from invoices where id = " + invoiceId;
	conInvoice.query(query, (err, result) => {
		if(err) res.send({response: "DB Issue"});
		let queryList = "delete from invoicelist where invoiceid = " + invoiceId;
			conInvoice.query(queryList, (err, result) => {
				if(err) res.send({response: "DB Issue"});
				res.send({response: "Successfully Deleted Invoice"});
			}); 
	});
});
    
    
const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, './public/upload')
		},
		filename: function (req, file, cb) {
			cb(null, file.originalname)
		}
});

	// const upload = multer({
	// 	storage: storage
	// })

var upload = multer({storage: storage}).array("file", 3);

app.post('/logo-image', (req, res) => {
		upload(req, res, function(err) {
			if (err) {
				res.send({'message': "Something went wrong!"});
			}
            res.send({'message': 'Image uploaded'});
        });		
});
	  
function validateUser(user){
	const schema = {
		name: Joi.string().min(3).max(10).required()
	}
	return Joi.validate(user, schema);
}


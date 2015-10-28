/**
* Brand.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    attributes: {
        name : {type: 'string',
                required: true,
                unique: true}
    },

  //Accepts an object or an int
    getOrCreate: function(brand) {
        return new Promise(function (resolve, reject) {
            if(typeof brand === 'object' && typeof brand.name !== 'undefined') {
                Brand.findOrCreate({name: brand.name},{name: brand.name})
                .exec(function(err, result){
                    if (err) reject(err.message);
                        resolve(result.id);
                });
            }
            else {
                Brand.findOne({id:brand})
                .exec(function (err, result) {
                    if (err) reject(err.message);
                    if(result) resolve(result.id);
                    reject(Error('no brand found for id : ' + brand));
                });
            }
        });
    }

};


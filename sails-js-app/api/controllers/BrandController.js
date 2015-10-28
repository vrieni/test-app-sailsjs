/**
 * BrandController
 * @description :: Server-side logic for managing Foods
 */

module.exports = {
    create: function (req, res) {
        var params = req.params.all();
        var json_params = {name: params.name};
        Brand.create(json_params)
        .exec(function(err, result) {
            if (!err) return res.json(result);
            else return res.badRequest(err)
        });

    }
};


exports.name    = function() {return "80-sfs.js" ; };
exports.purpose = function() {return "Look for blacklisted IPs via stopforumspam.com." ; };
exports.author  = function() { return "Steve Kemp <steve@steve.org.uk>" };


//
//  Test the IP the comment was submitted from against the stopforumspam.com site.
//
exports.testJSON = function ( obj, spam, ok, next )
{
    var ip     = obj['ip'] || "";
    var redis  = obj['_redis']
    var http   = require('http');

    //
    // Ensure the IP is an IPv4 address.
    //
    var ipv4  = /^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/;
    var match = ipv4.exec( ip );
    if ( !match )
    {
        next( "next" );
        return;
    }


    //
    //  The URL request we're going to make.
    //
    var options = {
        host: 'www.stopforumspam.com',
        port: 80,
        path: '/api?ip=' + ip,
    };

    //
    // A GET request.
    //
    var re = http.request(options, function(res) {
        var str = '';

        res.on('data', function(chunk) {
            str += chunk;
        });

        res.on('error', function(e) {
            console.log( "ERROR" + e);
            next("next");
        });
        res.on('end', function() {
            if ( str.indexOf( "<appears>yes</appears>" ) >= 0 )
            {
                //
                // Cache the IPs we've found listed for at least 48 hours.
                //
                redis.set( "blacklist-" + ip , "Listed in StopForumSpam.com" );
                redis.expire( "blacklist-" + ip , 60*60*48 );
                spam( "Listed in StopForumSpam.com"  );
            }
            else
            {
                next( "next" );
            }
        });
    });


    re.on('error', function(error) {
        console.log( "\tError fetching URL" );
        next('next');
    });

    re.end();
};



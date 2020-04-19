const _fs = require('fs');
import makeDir = require('make-dir')
import path = require('path')

// write a stream to destination file
export default function FileOutputStream(
  istream: any,
  destinationFilename: string,
){
    // wrap into Promise
    return new Promise(async function(resolve, reject){

        // file output stream
        let ostream: NodeJS.WriteStream | null = null;

        // on complete - chmod
        const onComplete = function(){
            // finish
            resolve();
        }

        // cleanup
        const onError = function(e: Error){
            // detach finish listener!
            if (ostream){
                ostream.removeListener('finish', onComplete);
            }
            
            // // close streams
            // if (istream){
                // istream.destroy();
            // }
            if (ostream){
                ostream.end();
            }

            // throw error
            reject(e);
        }

        // add additional error listener to input stream
        istream.on('error', onError);

        await makeDir(path.dirname(destinationFilename))
        // open write stream
        ostream = _fs.createWriteStream(destinationFilename);
        ostream!.on('error', onError);
        ostream!.on('finish', onComplete);

        // pipe in to out
        istream.pipe(ostream!);
    });
}

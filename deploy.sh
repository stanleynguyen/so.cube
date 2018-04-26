rm -rf .cache/ dist/ &&
npm run build &&
sed -i -e 's/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="512" height="512">/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve" width="512px" height="512px">/g' dist/index.html &&
sudo surge -d socube.surge.sh -p dist/

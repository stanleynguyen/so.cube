rm -rf .cache/ dist/ &&
npm run build &&
sudo surge -d socube.surge.sh -p dist/

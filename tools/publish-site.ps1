# creates build/html
rm -r build -errorAction ignore
$d = mkdir build
$d = mkdir build/html
cp -r Game2048/Content build/html/
cp -r Game2048/*.html build/html/
cp -r Game2048/style/*.css build/html/style/
cp -r Game2048/style/fonts Game2048/style/

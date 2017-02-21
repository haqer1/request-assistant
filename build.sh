mahsul="request-assistant-0.2.10.xpi"
cd src
for dosye in `find . -name "*~"`;
do
    echo "rm  $dosye"
    rm $dosye
done
jar -cfM $mahsul *
mkdir -p ../dist
mv $mahsul ../dist

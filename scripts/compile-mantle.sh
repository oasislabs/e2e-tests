#! /bin/bash

echo "Buliding mantle services"
pushd mantle
    for d in */ ; do
        pushd $d
            echo "Buliding $d..."
            oasis build --release &
        popd
    done

    for job in `jobs -p`
    do
        wait $job
    done
popd
echo "Done buliding mantle services"

#! /bin/bash

echo "Building Oasis services"
pushd services
    for d in */ ; do
        pushd $d
            echo "Building $d..."
            oasis build &
        popd
    done

    for job in `jobs -p`
    do
        wait $job
    done
popd
echo "Done building Oasis services"

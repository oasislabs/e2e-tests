FROM oasislabs/testing:0.2.0

# Install TVM
RUN apt-get install -y llvm-7 python3-pip

RUN git clone --recursive https://github.com/dmlc/tvm.git /tmp/tvm && \
    cd /tmp/tvm && \
    git checkout v0.5 && \
    mkdir build && cd build && \
    cmake .. -DUSE_LLVM=ON && \
    make -j4 && cd ../nnvm && make -j4 && cd .. && \
    pip3 install -e python -e nnvm/python -e topi/python

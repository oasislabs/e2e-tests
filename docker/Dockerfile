FROM oasislabs/testing:0.2.0

# Install TVM deps
RUN echo 'deb http://apt.llvm.org/bionic/ llvm-toolchain-bionic-8 main' >> /etc/apt/sources.list && \
    wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - && \
    apt-get update && \
    apt-get install -y llvm-8 python3-pip

# Install TVM
RUN git clone --recursive https://github.com/dmlc/tvm.git /tmp/tvm && \
    cd /tmp/tvm && \
    git checkout v0.5 && \
    mkdir build && cd build && \
    cmake .. -DUSE_LLVM=ON && \
    make -j4 && cd ../nnvm && make -j4 && cd .. && \
    pip3 install -e python -e nnvm/python -e topi/python

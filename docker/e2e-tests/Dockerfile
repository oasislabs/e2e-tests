FROM oasislabs/testing:0.2.0

# Install Wasm target
RUN rustup target add wasm32-unknown-unknown && \
    cargo install owasm-utils-cli --bin wasm-build

# Install TVM deps
RUN echo 'deb http://apt.llvm.org/bionic/ llvm-toolchain-bionic-8 main' >> /etc/apt/sources.list && \
    wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - && \
    apt-get update && \
    apt-get install -y llvm-8 python3-pip zip

# Install TVM
RUN git clone --recursive https://github.com/dmlc/tvm.git /tmp/tvm && \
    cd /tmp/tvm && \
    git checkout v0.5 && \
    curl 'https://gist.githubusercontent.com/nhynes/37cda1e2f7720636da47f04f6a3604aa/raw/c79987930cbd7dfc7af2955b36f05be4a7422ce8/tvm_wasm.patch' | git apply && \
    mkdir build && cd build && \
    cmake .. -DUSE_LLVM=llvm-config-8 && \
    make -j4 && cd ../nnvm && make -j4 && cd .. && \
    pip3 install -e python -e nnvm/python -e topi/python

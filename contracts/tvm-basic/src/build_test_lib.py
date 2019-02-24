#!/usr/bin/env python3

"""Prepares a simple TVM library for testing."""

from os import path as osp
import sys

import tvm


def main():
    n = tvm.var('n')
    A = tvm.placeholder((n,), name='A')
    B = tvm.placeholder((n,), name='B')
    C = tvm.compute(A.shape, lambda *i: A(*i) + B(*i), name='C')
    s = tvm.create_schedule(C.op)

    lib = tvm.build(s, [A, B, C],
                    'llvm -target=wasm32-unknown-unknown-wasm -system-lib')
    lib.save(osp.join(sys.argv[1], 'test.o'))


if __name__ == '__main__':
    main()


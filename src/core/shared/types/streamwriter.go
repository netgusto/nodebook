package types

type StreamWriter struct {
	write        func(data string)
	bytesWritten int
}

func NewStreamWriter(f func(data string)) *StreamWriter {
	return &StreamWriter{
		write: f,
	}
}

func (sw *StreamWriter) Write(p []byte) (n int, err error) {
	sw.write(string(p))
	sw.bytesWritten += len(p)
	return len(p), nil
}

func (sw StreamWriter) BytesWritten() int {
	return sw.bytesWritten
}

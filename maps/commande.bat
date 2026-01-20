docker run -d `
  --name antananarivo-map `
  -p 8080:8080 `
  -v ${PWD}/maps/data:/data `
  maptiler/tileserver-gl

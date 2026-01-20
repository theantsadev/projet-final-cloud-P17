docker run -d `
  --name antananarivo-map `
  -p 8081:8080 `
  -v ${PWD}/maps/data:/data `
  maptiler/tileserver-gl

docker run -d `
  --name antananarivo-map `
  -p 8080:8080 `
  -v ${PWD}/maps/output:/data `
  maptiler/tileserver-gl
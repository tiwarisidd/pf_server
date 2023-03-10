const extensions = {
  jpeg: "jpg",
};
function convertExtension(ext) {
  return extensions[ext];
}

export { convertExtension };

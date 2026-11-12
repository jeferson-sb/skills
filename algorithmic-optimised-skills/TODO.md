Change heuristics to be more detailed with a wide range of problems that have an existing solution (approaches per se) and 
try to keep it more lang. generic instead of TS-focused.

When comparing arrays with expensive operations (sorting, deep equality, serialization), check lengths first.

Always validate input before any iteration or expensive process.

Convert arrays to Set/Map for repeated membership checks.


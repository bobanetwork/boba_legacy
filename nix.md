[https://nixos.org/](Nix) is a purely functional, declarative system that builds
isolated packages (derivations) into their own unique subdirectories where
dependencies are tied to a graph rather than versions.

# Setup
You only need nix installed; it is able to provide yarn and all other tooling
for building boba's stack.

1. Install nix for your system (Linux, MacOS, WSL2 etc). Probably needs sudo priviliges:
   https://nixos.org/download.html
   Make sure to follow the instructions at the end of the install, for example
   reload your shell profile or run the shell script.
2. Run the command:
    nix --experimental-features 'nix-command flakes' develop 'github:bobanetwork/boba/nix'

This will drop you into a shell with various tools and commands to build Boba
Network's stack. It should print a menu for these commands. For example, to
build the entire optimism/boba stack, invoke `boba-buildall`.

If you want to overlay your current shell, you can install
[direnv](https://direnv.net/). and invoke `direnv allow` in the working directory

This uses a few nix-based technologies:
- [dream2nix](https://github.com/nix-community/dream2nix) - used for parsing any
  build systems into nix. In this case, it takes the yarn.lock file and creates
  nix derivations that are used everywhere.
- [devshell](https://github.com/numtide/devshell) - provides a developer shell
  where you can customize commands exclusive to your project. Can setup
  environmental variables, available packages, list commands through a menu
  system, etc.
- [Flakes](https://www.tweag.io/blog/2020-05-25-flakes/) - An upcoming feature
  to nix that provides hermetic builds.

# Notes

- Nix building will drop a symlink `result` in the current working directory. It
  points to the output in the nix store. For example, `boba-buildall`'s output
  looks something like this:

  `result -> /nix/store/h6jmzd36rpqnsp9pi9j3p2f042r3pdaz-boba-monorepo-0.0.1`

  The hash in front of the name and version is a summary of the complete inputs
  and sources to build the resulting output. Investigating the symlink you will
  find that all artifacts are symlinked in this way, for example `ls -l
  result/boba/contracts` will point to a path in the nix store, and its
  node_modules are similarly all symlinked to their proper outputs in the nix
  store, including the optimism/boba dependencies:

  `ls -l result/boba/contracts/lib/node_modules/@boba/contracts/node_modules/`

- Creating a docker image for any of the outputs is easily done by using the
  output name in `pkgs.dockerTools.buildImage`:
  [example](https://github.com/bobanetwork/boba/blob/nix/flake.nix#L80-L98)

- All of nix can be hidden behind commands using devshell.
  [Devshell](https://numtide.github.io/devshell/) can [load configurations from
  the more recognizable format
  toml](https://github.com/numtide/devshell#configurable-with-a-toml-file).

- Direnv/devshell can be used together to overlay the shell on top of your
  current familiar shell.

# TODO

- Cache the evaluation. Dream2nix re-evaluates the `yarn.lock` and
  `package.json` upon any change to the repo, which is time consuming.
- Prune closure of build outputs. Create separate `.dev` for builds that include
  `devDependencies`. This will greatly reduce the size of docker builds.
- Use [Cachix](https://www.cachix.org/) to store output closures so that
  developers can retrieve the already-built boba monorepo for their system.
- Use [HerculesCI](https://hercules-ci.com/) to automatically build for each
  system and push to cachix.
- Run docker services using [Arion](https://docs.hercules-ci.com/arion/), a
  docker-compose wrapper for nix.
- Or, alternatively to the above, for development run Procfiles using
  [Foreman](https://github.com/ddollar/foreman) in devshell to develop without
  using containers, and leave the docker builds for production.
- Use [direnv](https://github.com/direnv/direnv) to automatically load
  environments depending on the directory/package you're currently browsing.
